# Multi-Course Calendar Enhancement

## Current System Analysis

### How It Currently Works:
1. **Course-First Selection** - User picks a course, then sees only that course's sessions
2. **Single-Course Calendar** - Calendar shows sessions for selected course only
3. **Individual Session Management** - Each session tracked independently

### Current Code Logic:
```typescript
// Current: Course-specific calendar
const getCalendarEvents = () => {
  if (!selectedCourse) return []
  
  return selectedCourse.sessions.map(session => ({
    id: session.id,
    title: `${selectedCourse.title} (${session.availableSpots - session.bookedSpots} spots)`,
    start: session.startDate,
    end: session.endDate,
    // ... only shows ONE course's sessions
  }))
}
```

## Enhanced Multi-Course Calendar

### Option 1: All-Courses Overview Calendar

```typescript
// Enhanced: Multi-course calendar view
const getCalendarEvents = () => {
  if (viewMode === 'all-courses') {
    // Show ALL courses and sessions
    return allCourses.flatMap(course => 
      course.sessions.map(session => ({
        id: session.id,
        title: `${course.title} (${session.availableSpots - session.bookedSpots} spots)`,
        start: session.startDate,
        end: session.endDate,
        backgroundColor: getCourseColor(course.category),
        extendedProps: {
          course: course,
          session: session,
          category: course.category
        }
      }))
    )
  } else if (selectedCourse) {
    // Current single-course view
    return selectedCourse.sessions.map(session => ({ ... }))
  }
  return []
}

// Color coding by course category
const getCourseColor = (category: string) => {
  switch (category) {
    case 'GAS_SAFE': return '#dc2626'    // Red
    case 'HEAT_PUMP': return '#16a34a'   // Green
    case 'OFTEC': return '#2563eb'       // Blue
    case 'LPG': return '#7c3aed'         // Purple
    default: return '#6b7280'            // Gray
  }
}
```

### Option 2: Filtered Multi-Course View

```typescript
// Calendar with course category filters
const [selectedCategories, setSelectedCategories] = useState<string[]>(['GAS_SAFE', 'HEAT_PUMP', 'OFTEC'])

const getFilteredCalendarEvents = () => {
  return allCourses
    .filter(course => selectedCategories.includes(course.category))
    .flatMap(course => 
      course.sessions.map(session => ({
        id: session.id,
        title: `${course.title}`,
        start: session.startDate,
        end: session.endDate,
        backgroundColor: getCourseColor(course.category),
        textColor: '#ffffff',
        extendedProps: {
          course: course,
          session: session,
          spotsLeft: session.availableSpots - session.bookedSpots
        }
      }))
    )
}
```

### Option 3: Time Conflict Detection

```typescript
// Detect scheduling conflicts
const detectConflicts = (sessions: Session[]) => {
  const conflicts: string[] = []
  
  sessions.forEach((session, i) => {
    sessions.slice(i + 1).forEach((otherSession) => {
      if (hasTimeOverlap(session, otherSession)) {
        conflicts.push(`${session.course.title} conflicts with ${otherSession.course.title} on ${session.startDate}`)
      }
    })
  })
  
  return conflicts
}

const hasTimeOverlap = (session1: Session, session2: Session) => {
  const start1 = new Date(`${session1.startDate}T${session1.startTime}`)
  const end1 = new Date(`${session1.endDate}T${session1.endTime}`)
  const start2 = new Date(`${session2.startDate}T${session2.startTime}`)
  const end2 = new Date(`${session2.endDate}T${session2.endTime}`)
  
  return start1 < end2 && start2 < end1
}
```

## Implementation Strategy

### Phase 1: Enhanced Calendar Views (Week 1)

#### Add View Mode Toggle:
```typescript
const [calendarView, setCalendarView] = useState<'single-course' | 'all-courses' | 'filtered'>('single-course')

// View toggle buttons
<div className="mb-4 flex space-x-2">
  <button 
    onClick={() => setCalendarView('single-course')}
    className={`px-4 py-2 rounded ${calendarView === 'single-course' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
  >
    Selected Course Only
  </button>
  <button 
    onClick={() => setCalendarView('all-courses')}
    className={`px-4 py-2 rounded ${calendarView === 'all-courses' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
  >
    All Courses
  </button>
  <button 
    onClick={() => setCalendarView('filtered')}
    className={`px-4 py-2 rounded ${calendarView === 'filtered' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
  >
    Filter by Category
  </button>
</div>
```

#### Category Filter Checkboxes:
```typescript
{calendarView === 'filtered' && (
  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
    <h4 className="font-medium mb-2">Course Categories:</h4>
    <div className="flex flex-wrap gap-3">
      {['GAS_SAFE', 'HEAT_PUMP', 'OFTEC', 'LPG'].map(category => (
        <label key={category} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedCategories.includes(category)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCategories([...selectedCategories, category])
              } else {
                setSelectedCategories(selectedCategories.filter(c => c !== category))
              }
            }}
            className="mr-2"
          />
          <span className="capitalize">{category.replace('_', ' ')}</span>
        </label>
      ))}
    </div>
  </div>
)}
```

### Phase 2: Enhanced Session Display (Week 2)

#### Multi-Course Session List:
```typescript
// Show sessions from multiple courses
{calendarView !== 'single-course' && (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h3 className="text-xl font-semibold mb-4">Available Sessions</h3>
    <div className="space-y-4">
      {getFilteredSessions().map((session) => {
        const spotsLeft = session.availableSpots - session.bookedSpots
        return (
          <div key={session.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-lg">{session.course.title}</p>
                <p className="text-sm text-gray-600">{formatDate(session.startDate)}</p>
                <p className="text-sm text-gray-600">{session.startTime} - {session.endTime}</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryBadge(session.course.category)}`}>
                  {session.course.category.replace('_', ' ')}
                </span>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${spotsLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Fully booked'}
                </p>
                <button 
                  onClick={() => handleSessionSelect(session)}
                  disabled={spotsLeft === 0}
                  className={`mt-2 px-3 py-1 rounded text-sm ${
                    spotsLeft > 0 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {spotsLeft > 0 ? 'Select' : 'Full'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}
```

### Phase 3: Conflict Detection & Warnings (Week 3)

#### Admin Warning System:
```typescript
// In admin dashboard
const getSchedulingConflicts = () => {
  const allSessions = courses.flatMap(course => course.sessions)
  return detectConflicts(allSessions)
}

// Display warnings
{conflicts.length > 0 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Scheduling Conflicts Detected:</h4>
    <ul className="list-disc list-inside text-yellow-700">
      {conflicts.map((conflict, index) => (
        <li key={index}>{conflict}</li>
      ))}
    </ul>
  </div>
)}
```

## User Experience Scenarios

### Scenario 1: Same Day, Different Courses
```
September 18th:
🔴 09:00-17:00: ACS CORE Assessment (Red - Gas Safe)
🟢 09:00-17:00: Heat Pump Installation (Green - Heat Pump)
```

**Enhanced Experience:**
- All-courses view shows both sessions
- Color-coded by category
- Clear conflict warning (same time)
- User can compare and choose

### Scenario 2: Same Day, Different Times
```
September 18th:
🔴 09:00-13:00: Gas Safe Morning (Red - 8 spots)
🔵 14:00-18:00: OFTEC Afternoon (Blue - 6 spots)
```

**Enhanced Experience:**
- Both sessions visible on calendar
- No conflict (different times)
- Easy to see daily schedule
- Can book back-to-back sessions

### Scenario 3: Multi-Day Courses
```
Week of September 18th:
🔴 Mon-Wed: ACS CORE (3 days)
🟢 Thu-Fri: Heat Pump (2 days)
```

**Enhanced Experience:**
- Multi-day courses show as blocks
- Clear visual separation
- Easy to see weekly overview
- No booking conflicts

## Benefits of Enhanced System

### For Customers:
✅ **Better Overview** - See all training options at once
✅ **Easy Comparison** - Compare dates, times, availability
✅ **Informed Decisions** - Understand full schedule before booking
✅ **Conflict Avoidance** - See potential scheduling issues

### For Training Centers:
✅ **Resource Planning** - Visualize instructor/room conflicts
✅ **Optimization** - Better utilization of facilities
✅ **Customer Service** - Reduce booking confusion
✅ **Revenue** - Easier to sell multiple courses

### For Administrators:
✅ **Conflict Detection** - Automatic warning system
✅ **Capacity Management** - Visual overview of all bookings
✅ **Reporting** - Better analytics and insights
✅ **Planning** - Easier to schedule new sessions

## Implementation Priority

### Phase 1 (High Impact, Low Effort):
1. **All-courses calendar view** - Show everything at once
2. **Color coding by category** - Visual differentiation
3. **Enhanced session list** - Multi-course display

### Phase 2 (Medium Effort, High Value):
1. **Category filtering** - Checkbox filters
2. **View mode toggle** - Switch between views
3. **Conflict warnings** - Basic overlap detection

### Phase 3 (Future Enhancement):
1. **Advanced scheduling** - Drag & drop admin interface
2. **Resource management** - Room/instructor assignment
3. **Auto-optimization** - Suggest better scheduling

## Technical Considerations

### Database Impact:
- **No schema changes needed** - Current structure supports this
- **Query optimization** - May need to fetch all courses/sessions
- **Caching strategy** - Cache course data for better performance

### Performance:
- **Client-side filtering** - Fast category/date filtering
- **Lazy loading** - Load sessions on-demand
- **Efficient rendering** - Virtual scrolling for large lists

### Mobile Experience:
- **Responsive design** - Calendar adapts to small screens
- **Touch interactions** - Easy session selection
- **Simplified views** - Reduce complexity on mobile

---

**RECOMMENDATION:** Start with Phase 1 (all-courses view) - it's high impact, relatively easy to implement, and immediately improves the user experience for training centers with multiple courses running simultaneously.