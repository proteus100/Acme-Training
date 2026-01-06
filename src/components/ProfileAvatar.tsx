import { 
  Flame, 
  Zap, 
  Droplets, 
  Snowflake, 
  Wind, 
  Wrench,
  Award,
  Crown,
  Star,
  Shield
} from 'lucide-react'

interface ProfileAvatarProps {
  qualifications: string[]
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTooltip?: boolean
}

interface AvatarConfig {
  icon: React.ElementType
  gradient: string
  title: string
  description: string
}

// Category mapping for individual specialties
const categoryAvatars: Record<string, AvatarConfig> = {
  GAS_SAFE: {
    icon: Flame,
    gradient: 'from-blue-500 to-blue-600',
    title: 'Gas Safe Specialist',
    description: 'Qualified in gas installation and maintenance'
  },
  HEAT_PUMP: {
    icon: Wind,
    gradient: 'from-green-500 to-green-600',
    title: 'Heat Pump Specialist',
    description: 'Expert in heat pump systems'
  },
  OFTEC: {
    icon: Droplets,
    gradient: 'from-orange-500 to-orange-600',
    title: 'OFTEC Specialist',
    description: 'Oil heating systems expert'
  },
  LPG: {
    icon: Wrench,
    gradient: 'from-purple-500 to-purple-600',
    title: 'LPG Specialist',
    description: 'Liquid petroleum gas systems'
  },
  ELECTRICAL: {
    icon: Zap,
    gradient: 'from-yellow-500 to-yellow-600',
    title: 'Electrical Specialist',
    description: 'Electrical installations and maintenance'
  },
  REFRIGERATION: {
    icon: Snowflake,
    gradient: 'from-cyan-500 to-cyan-600',
    title: 'Refrigeration Specialist',
    description: 'Commercial refrigeration systems'
  },
  FGAS_AIR_CONDITIONING: {
    icon: Wind,
    gradient: 'from-teal-500 to-teal-600',
    title: 'Air Conditioning Specialist',
    description: 'F-Gas and air conditioning systems'
  }
}

// Tier system for multi-qualified professionals
const tierAvatars: Record<string, AvatarConfig> = {
  'multi-trade': {
    icon: Award,
    gradient: 'from-indigo-500 to-purple-600',
    title: 'Multi-Trade Professional',
    description: 'Qualified in multiple specialties'
  },
  'master-technician': {
    icon: Crown,
    gradient: 'from-purple-600 to-pink-600',
    title: 'Master Technician',
    description: 'Expert across multiple disciplines'
  },
  'industry-expert': {
    icon: Star,
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    title: 'Industry Expert',
    description: 'Highly qualified across all major areas'
  }
}

export default function ProfileAvatar({ 
  qualifications = [], 
  size = 'md', 
  showTooltip = true 
}: ProfileAvatarProps) {
  
  const getAvatarConfig = (): AvatarConfig => {
    const qualCount = qualifications.length
    
    // Default for no qualifications
    if (qualCount === 0) {
      return {
        icon: Shield,
        gradient: 'from-gray-400 to-gray-500',
        title: 'Trainee',
        description: 'Starting your professional journey'
      }
    }
    
    // Single qualification - use specific category avatar
    if (qualCount === 1) {
      const category = qualifications[0]
      return categoryAvatars[category] || categoryAvatars.GAS_SAFE
    }
    
    // Multi-qualified tiers
    if (qualCount === 2) {
      return tierAvatars['multi-trade']
    }
    
    if (qualCount >= 3 && qualCount <= 4) {
      return tierAvatars['master-technician']
    }
    
    // 5+ qualifications = Industry Expert
    return tierAvatars['industry-expert']
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8'
      case 'md':
        return 'w-12 h-12'
      case 'lg':
        return 'w-16 h-16'
      case 'xl':
        return 'w-24 h-24'
      default:
        return 'w-12 h-12'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'md':
        return 'w-6 h-6'
      case 'lg':
        return 'w-8 h-8'
      case 'xl':
        return 'w-12 h-12'
      default:
        return 'w-6 h-6'
    }
  }

  const config = getAvatarConfig()
  const Icon = config.icon

  const avatar = (
    <div 
      className={`
        ${getSizeClasses()} 
        bg-gradient-to-br ${config.gradient} 
        rounded-full 
        flex items-center justify-center 
        shadow-lg 
        ring-2 ring-white
        ${qualifications.length >= 3 ? 'ring-4 ring-yellow-300 shadow-xl' : ''}
        ${qualifications.length >= 5 ? 'animate-pulse' : ''}
      `}
    >
      <Icon className={`${getIconSize()} text-white`} />
      
      {/* Multi-qualification badge */}
      {qualifications.length > 1 && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
          <span className={`
            ${qualifications.length === 2 ? 'text-indigo-600' : ''}
            ${qualifications.length >= 3 && qualifications.length <= 4 ? 'text-purple-600' : ''}
            ${qualifications.length >= 5 ? 'text-yellow-600' : ''}
          `}>
            {qualifications.length}
          </span>
        </div>
      )}
    </div>
  )

  if (!showTooltip) {
    return avatar
  }

  return (
    <div className="relative group">
      {avatar}
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        <div className="font-medium">{config.title}</div>
        <div className="text-xs text-gray-300">{config.description}</div>
        {qualifications.length > 1 && (
          <div className="text-xs text-gray-300 mt-1">
            {qualifications.length} specialties
          </div>
        )}
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )
}

// Helper function to get qualifications from user data
export const getUserQualifications = (bookings: any[] = [], achievements: any[] = []) => {
  const qualifications = new Set<string>()
  
  // From completed bookings
  bookings.forEach(booking => {
    if (booking.status === 'COMPLETED' && booking.session?.course?.category) {
      qualifications.add(booking.session.course.category)
    }
  })
  
  // From achievements/certifications
  achievements.forEach(achievement => {
    if (achievement.category) {
      qualifications.add(achievement.category)
    }
  })
  
  return Array.from(qualifications)
}

// Export tier information for use in other components
export const getTierInfo = (qualificationCount: number) => {
  if (qualificationCount === 0) {
    return { tier: 'trainee', title: 'Trainee', color: 'gray' }
  }
  if (qualificationCount === 1) {
    return { tier: 'specialist', title: 'Specialist', color: 'blue' }
  }
  if (qualificationCount === 2) {
    return { tier: 'multi-trade', title: 'Multi-Trade Professional', color: 'indigo' }
  }
  if (qualificationCount >= 3 && qualificationCount <= 4) {
    return { tier: 'master', title: 'Master Technician', color: 'purple' }
  }
  return { tier: 'expert', title: 'Industry Expert', color: 'yellow' }
}