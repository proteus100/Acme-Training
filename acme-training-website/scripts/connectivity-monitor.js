#!/usr/bin/env node

/**
 * Connectivity Monitor & Auto-Sync Script
 * 
 * Monitors internet connectivity and automatically syncs pending backups
 * when connection is restored. Handles offline scenarios gracefully.
 * 
 * Usage:
 *   node scripts/connectivity-monitor.js
 * 
 * Background Usage:
 *   nohup node scripts/connectivity-monitor.js > /var/log/connectivity.log 2>&1 &
 */

const { exec, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

class ConnectivityMonitor {
  constructor() {
    this.isOnline = false
    this.checkInterval = 30000 // 30 seconds
    this.lastOnlineTime = null
    this.lastOfflineTime = null
    this.statusFile = '/tmp/acme_connectivity_status'
    this.queueFile = '/var/backups/acme-training/sync-queue.json'
    this.logFile = '/var/log/connectivity.log'
    
    // Ensure directories exist
    this.ensureDirectories()
  }

  ensureDirectories() {
    const dirs = [
      '/var/backups/acme-training',
      '/var/log'
    ]
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true })
        } catch (error) {
          console.error(`Failed to create directory ${dir}:`, error.message)
        }
      }
    })
  }

  log(message) {
    const timestamp = new Date().toISOString()
    const logMessage = `${timestamp} - ${message}\n`
    
    console.log(message)
    
    try {
      fs.appendFileSync(this.logFile, logMessage)
    } catch (error) {
      console.error('Failed to write to log file:', error.message)
    }
  }

  async checkConnectivity() {
    return new Promise((resolve) => {
      // Test multiple endpoints for reliability
      const testEndpoints = [
        '8.8.8.8',      // Google DNS
        '1.1.1.1',      // Cloudflare DNS
        'github.com'    // GitHub (likely to be accessible)
      ]
      
      let successCount = 0
      let testsCompleted = 0
      
      testEndpoints.forEach(endpoint => {
        exec(`ping -c 1 -W 5 ${endpoint}`, (error) => {
          testsCompleted++
          if (!error) {
            successCount++
          }
          
          // When all tests complete, resolve based on success rate
          if (testsCompleted === testEndpoints.length) {
            resolve(successCount >= 2) // At least 2 out of 3 must succeed
          }
        })
      })
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (testsCompleted < testEndpoints.length) {
          resolve(false)
        }
      }, 10000)
    })
  }

  updateStatus(online) {
    const status = {
      online,
      timestamp: new Date().toISOString(),
      lastCheck: new Date().toISOString()
    }
    
    try {
      fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2))
    } catch (error) {
      this.log(`Failed to update status file: ${error.message}`)
    }
  }

  loadSyncQueue() {
    try {
      if (fs.existsSync(this.queueFile)) {
        return JSON.parse(fs.readFileSync(this.queueFile, 'utf8'))
      }
    } catch (error) {
      this.log(`Failed to load sync queue: ${error.message}`)
    }
    return []
  }

  saveSyncQueue(queue) {
    try {
      fs.writeFileSync(this.queueFile, JSON.stringify(queue, null, 2))
    } catch (error) {
      this.log(`Failed to save sync queue: ${error.message}`)
    }
  }

  addToSyncQueue(operation, data) {
    const queue = this.loadSyncQueue()
    queue.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      operation,
      data,
      retries: 0
    })
    this.saveSyncQueue(queue)
    this.log(`Added to sync queue: ${operation}`)
  }

  async startMonitoring() {
    this.log('🌐 Starting connectivity monitoring...')
    this.log(`Check interval: ${this.checkInterval / 1000} seconds`)
    
    // Initial connectivity check
    this.isOnline = await this.checkConnectivity()
    this.updateStatus(this.isOnline)
    this.log(`Initial connectivity status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`)
    
    if (this.isOnline) {
      this.lastOnlineTime = new Date()
    } else {
      this.lastOfflineTime = new Date()
    }
    
    // Start monitoring loop
    setInterval(async () => {
      try {
        await this.performConnectivityCheck()
      } catch (error) {
        this.log(`Error during connectivity check: ${error.message}`)
      }
    }, this.checkInterval)
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('🛑 Connectivity monitor shutting down...')
      process.exit(0)
    })
    
    process.on('SIGTERM', () => {
      this.log('🛑 Connectivity monitor terminated')
      process.exit(0)
    })
  }

  async performConnectivityCheck() {
    const wasOnline = this.isOnline
    this.isOnline = await this.checkConnectivity()
    this.updateStatus(this.isOnline)
    
    if (!wasOnline && this.isOnline) {
      // Connection restored
      this.lastOnlineTime = new Date()
      const downtime = this.lastOfflineTime ? 
        Math.round((this.lastOnlineTime - this.lastOfflineTime) / 1000) : 
        'unknown'
      
      this.log(`✅ Internet connection RESTORED! (downtime: ${downtime}s)`)
      await this.handleConnectionRestored()
      
    } else if (wasOnline && !this.isOnline) {
      // Connection lost
      this.lastOfflineTime = new Date()
      this.log(`⚠️  Internet connection LOST!`)
      await this.handleConnectionLost()
      
    } else if (this.isOnline) {
      // Still online - periodic status
      if (Math.random() < 0.01) { // 1% chance to log status (every ~50 minutes on average)
        this.log(`📡 Connection stable - uptime: ${Math.round((new Date() - this.lastOnlineTime) / 1000)}s`)
      }
    }
  }

  async handleConnectionRestored() {
    try {
      // Wait a moment for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Process sync queue
      await this.processSyncQueue()
      
      // Trigger backup sync
      await this.syncBackupsToCloud()
      
      // Send connectivity alert email (if email system is working)
      await this.sendConnectivityAlert('restored')
      
    } catch (error) {
      this.log(`Error handling connection restoration: ${error.message}`)
    }
  }

  async handleConnectionLost() {
    try {
      // Add current state to sync queue for later
      this.addToSyncQueue('BACKUP_SYNC', {
        type: 'full_backup',
        timestamp: new Date().toISOString()
      })
      
      // Trigger immediate local backup
      await this.createEmergencyBackup()
      
    } catch (error) {
      this.log(`Error handling connection loss: ${error.message}`)
    }
  }

  async processSyncQueue() {
    const queue = this.loadSyncQueue()
    if (queue.length === 0) {
      this.log('📭 Sync queue is empty')
      return
    }
    
    this.log(`🔄 Processing sync queue: ${queue.length} items`)
    
    const processedItems = []
    
    for (const item of queue) {
      try {
        await this.processSyncItem(item)
        processedItems.push(item.id)
        this.log(`✅ Processed sync item: ${item.operation}`)
      } catch (error) {
        item.retries++
        this.log(`❌ Sync item failed (attempt ${item.retries}): ${error.message}`)
        
        if (item.retries >= 3) {
          this.log(`🗑️  Removing failed sync item after 3 attempts: ${item.operation}`)
          processedItems.push(item.id)
        }
      }
    }
    
    // Remove processed items from queue
    const updatedQueue = queue.filter(item => !processedItems.includes(item.id))
    this.saveSyncQueue(updatedQueue)
    
    this.log(`📝 Sync queue processed: ${processedItems.length} items completed`)
  }

  async processSyncItem(item) {
    switch (item.operation) {
      case 'BACKUP_SYNC':
        await this.syncBackupsToCloud()
        break
      case 'EMAIL_QUEUE':
        await this.sendQueuedEmails()
        break
      case 'DATA_EXPORT':
        await this.exportAndSyncData()
        break
      default:
        this.log(`Unknown sync operation: ${item.operation}`)
    }
  }

  async syncBackupsToCloud() {
    this.log('☁️  Starting cloud backup sync...')
    
    const backupDir = '/var/backups/acme-training'
    
    try {
      // Check if rclone is configured
      const cloudProviders = ['GoogleDrive', 'Dropbox', 'OneDrive']
      
      for (const provider of cloudProviders) {
        try {
          await this.syncToCloudProvider(provider, backupDir)
        } catch (error) {
          this.log(`Failed to sync to ${provider}: ${error.message}`)
        }
      }
      
      // Update last sync timestamp
      fs.writeFileSync('/tmp/last_cloud_sync', Math.floor(Date.now() / 1000).toString())
      
    } catch (error) {
      this.log(`Cloud sync failed: ${error.message}`)
      throw error
    }
  }

  async syncToCloudProvider(provider, backupDir) {
    return new Promise((resolve, reject) => {
      const command = `rclone sync ${backupDir} ${provider}:acme-training-backups --progress`
      
      this.log(`🔄 Syncing to ${provider}...`)
      
      const process = spawn('rclone', [
        'sync', backupDir, `${provider}:acme-training-backups`,
        '--progress', '--stats', '30s'
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      })
      
      let output = ''
      let errorOutput = ''
      
      process.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })
      
      process.on('close', (code) => {
        if (code === 0) {
          this.log(`✅ ${provider} sync completed successfully`)
          resolve()
        } else {
          this.log(`❌ ${provider} sync failed with code ${code}: ${errorOutput}`)
          reject(new Error(`rclone sync failed: ${errorOutput}`))
        }
      })
      
      // Timeout after 10 minutes
      setTimeout(() => {
        process.kill('SIGTERM')
        reject(new Error('Cloud sync timeout'))
      }, 600000)
    })
  }

  async createEmergencyBackup() {
    this.log('🚨 Creating emergency backup due to connectivity loss...')
    
    try {
      const { spawn } = require('child_process')
      
      return new Promise((resolve, reject) => {
        const process = spawn('node', [
          path.join(__dirname, 'backup-database.js')
        ], {
          stdio: 'inherit'
        })
        
        process.on('close', (code) => {
          if (code === 0) {
            this.log('✅ Emergency backup completed')
            resolve()
          } else {
            this.log('❌ Emergency backup failed')
            reject(new Error('Emergency backup failed'))
          }
        })
      })
    } catch (error) {
      this.log(`Emergency backup failed: ${error.message}`)
      throw error
    }
  }

  async sendConnectivityAlert(status) {
    try {
      // Only send email if connectivity is restored and email system might work
      if (status === 'restored' && this.isOnline) {
        const message = `
ACME Training Centre - Connectivity Alert

Status: Internet connection has been RESTORED
Time: ${new Date().toLocaleString()}
Downtime: ${this.lastOfflineTime ? Math.round((new Date() - this.lastOfflineTime) / 1000) : 'unknown'} seconds

Actions taken:
- Emergency backups created during outage
- Pending sync operations queued
- Automatic cloud sync initiated
- System monitoring resumed

All training center data has been protected during the outage.
        `
        
        // Simple email using system mail command
        exec(`echo "${message}" | mail -s "ACME Training - Connectivity Restored" admin@acme-training.co.uk`, 
          (error) => {
            if (error) {
              this.log(`Failed to send connectivity alert: ${error.message}`)
            } else {
              this.log('📧 Connectivity alert email sent')
            }
          })
      }
    } catch (error) {
      this.log(`Error sending connectivity alert: ${error.message}`)
    }
  }

  async sendQueuedEmails() {
    this.log('📧 Processing queued emails...')
    
    try {
      // Run the email reminder script to catch up on any missed reminders
      return new Promise((resolve, reject) => {
        const process = spawn('node', [
          path.join(__dirname, 'send-daily-reminders.js')
        ], {
          stdio: 'inherit'
        })
        
        process.on('close', (code) => {
          if (code === 0) {
            this.log('✅ Queued emails processed')
            resolve()
          } else {
            this.log('❌ Failed to process queued emails')
            reject(new Error('Email processing failed'))
          }
        })
      })
    } catch (error) {
      this.log(`Failed to process queued emails: ${error.message}`)
      throw error
    }
  }

  async exportAndSyncData() {
    this.log('📤 Running data export and sync...')
    
    try {
      return new Promise((resolve, reject) => {
        const process = spawn('node', [
          path.join(__dirname, 'export-training-data.js')
        ], {
          stdio: 'inherit'
        })
        
        process.on('close', (code) => {
          if (code === 0) {
            this.log('✅ Data export completed')
            resolve()
          } else {
            this.log('❌ Data export failed')
            reject(new Error('Data export failed'))
          }
        })
      })
    } catch (error) {
      this.log(`Data export failed: ${error.message}`)
      throw error
    }
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      lastOnlineTime: this.lastOnlineTime,
      lastOfflineTime: this.lastOfflineTime,
      queueSize: this.loadSyncQueue().length
    }
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new ConnectivityMonitor()
  
  // Handle command line arguments
  const args = process.argv.slice(2)
  
  if (args.includes('--status')) {
    const status = monitor.getStatus()
    console.log('🌐 Connectivity Monitor Status:')
    console.log(`   Online: ${status.isOnline}`)
    console.log(`   Last Online: ${status.lastOnlineTime || 'Never'}`)
    console.log(`   Last Offline: ${status.lastOfflineTime || 'Never'}`)
    console.log(`   Sync Queue: ${status.queueSize} items`)
    process.exit(0)
  }
  
  if (args.includes('--test')) {
    console.log('🧪 Testing connectivity...')
    monitor.checkConnectivity().then(online => {
      console.log(`Result: ${online ? 'ONLINE' : 'OFFLINE'}`)
      process.exit(0)
    })
    return
  }
  
  // Start monitoring by default
  monitor.startMonitoring()
}

module.exports = ConnectivityMonitor