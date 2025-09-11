import Link from 'next/link'
import { Calendar, Users, Award, MapPin, Clock, Star } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">ACME Training Centre</h1>
            <nav className="hidden md:flex space-x-6">
              <Link href="/courses" className="hover:text-blue-200">Courses</Link>
              <Link href="/booking" className="hover:text-blue-200">Book Now</Link>
              <Link href="/about" className="hover:text-blue-200">About</Link>
              <Link href="/contact" className="hover:text-blue-200">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Professional Gas & Heating Training
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Newton Abbot's premier training centre for Gas Safe, Heat Pump, OFTEC, and LPG qualifications. 
            Flexible scheduling with short notice, weekend and evening availability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses" className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-lg font-semibold transition-colors">
              View Courses
            </Link>
            <Link href="/booking" className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-800 px-8 py-3 rounded-lg font-semibold transition-colors">
              Book Training
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose ACME Training?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-3">Flexible Scheduling</h4>
              <p className="text-gray-600">Short notice bookings available with weekend and evening sessions to fit your schedule.</p>
            </div>
            <div className="text-center p-6">
              <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-3">Industry Approved</h4>
              <p className="text-gray-600">WRAS approved training centre and official Ariston training center.</p>
            </div>
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-3">Local & Friendly</h4>
              <p className="text-gray-600">Based in Newton Abbot, providing personal service and local expertise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Training Categories</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Gas Safe Training",
                description: "Gas cooker training, gas fires training and testing, new gas training for beginners",
                icon: "🔥"
              },
              {
                title: "Heat Pump Training",
                description: "Installation, servicing and maintenance of heat pump systems",
                icon: "🌡️"
              },
              {
                title: "OFTEC Oil Qualifications",
                description: "Pressure jet boilers and vaporizing appliances like AGA, Rayburn, Esse",
                icon: "🛢️"
              },
              {
                title: "LPG Training",
                description: "Covering permanent, mobile homes, park homes, leisure vehicles, Widney fires",
                icon: "⚡"
              }
            ].map((category, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg border hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">{category.icon}</div>
                <h4 className="text-xl font-semibold mb-3">{category.title}</h4>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <Link href="/courses" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Your Training?</h3>
          <p className="text-xl mb-8">Book your course today with our easy online booking system</p>
          <Link href="/booking" className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-lg font-semibold transition-colors inline-block">
            Book Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">ACME Training Centre</h4>
              <p className="text-gray-300">Professional gas and heating training in Newton Abbot</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-300">Newton Abbot, Devon</p>
              <p className="text-gray-300">Email: info@acme-training.co.uk</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/courses" className="block text-gray-300 hover:text-white">Courses</Link>
                <Link href="/booking" className="block text-gray-300 hover:text-white">Book Training</Link>
                <Link href="/contact" className="block text-gray-300 hover:text-white">Contact</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 ACME Training Centre. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}