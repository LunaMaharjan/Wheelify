import Image from "next/image";
import Link from "next/link";
import { Search, Check, CreditCard, Car, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { vehicleTypes, popularVehicles, howItWorksSteps, testimonials } from "@/lib/mockData";

export default async function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop"
            alt="City street with vehicles"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Rent a vehicle near you
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            Explore a wide range of vehicles for rent, from cars to bikes and scooters, all in one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for vehicles"
                className="pl-10 h-12 bg-white/95 text-base"
              />
            </div>
            <Button size="lg" className="h-12 px-8">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Rent by Vehicle Type Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Rent by vehicle type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {vehicleTypes.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden pt-0 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="relative h-64 w-full">
                <Image
                  src={vehicle.image}
                  alt={vehicle.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{vehicle.name}</CardTitle>
                {vehicle.description && (
                  <CardDescription>{vehicle.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular Vehicles Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Popular vehicles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg pt-0 transition-shadow cursor-pointer">
                <div className="relative h-64 w-full">
                  <Image
                    src={vehicle.image}
                    alt={vehicle.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{vehicle.title}</CardTitle>
                  <CardDescription>{vehicle.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">How it works</h2>
          <p className="text-2xl font-semibold mb-4">Simple steps to rent a vehicle</p>
          <p className="text-muted-foreground">Our platform makes renting a vehicle easy and convenient.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {howItWorksSteps.map((step) => {
            const IconComponent = 
              step.icon === "search" ? Search :
              step.icon === "check" ? Check :
              step.icon === "credit-card" ? CreditCard :
              Car;
            
            return (
              <Card key={step.id} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-primary/10 p-4">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <CardDescription className="mt-2">{step.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription className="text-xs">{testimonial.date}</CardDescription>
                    </div>
                  </div>
                  <CardDescription className="text-base mt-2">
                    &quot;{testimonial.quote}&quot;
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to hit the road?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Sign up or log in to start renting your perfect vehicle today.
        </p>
        <Link href="/signup">
          <Button size="lg" className="px-8">
            Start Renting
          </Button>
        </Link>
      </section>
    </div>
  );
}
