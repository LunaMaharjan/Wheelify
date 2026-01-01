export interface VehicleType {
  id: string;
  name: string;
  image: string;
  description?: string;
  query: string;
}

export interface PopularVehicle {
  id: string;
  title: string;
  description: string;
  image: string;
  type: string;
}

export interface HowItWorksStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  quote: string;
}

export const vehicleTypes: VehicleType[] = [
  {
    id: "1",
    name: "Cars",
    query: "car",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
    description: "Explore our wide range of cars"
  },
  {
    id: "2",
    name: "Bikes",
    query: "bike",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop",
    description: "Rent a bike for your adventure"
  },
  {
    id: "3",
    name: "Scooters",
    query: "scooter",
    image: "https://images.unsplash.com/photo-1554223789-df81106a45ed?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Zip through the city with ease"
  }
];

export const popularVehicles: PopularVehicle[] = [
  {
    id: "1",
    title: "Luxury Sedan",
    description: "Rent a luxury sedan for a comfortable ride.",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop",
    type: "car"
  },
  {
    id: "2",
    title: "Electric Bike",
    description: "Explore the city with an electric bike.",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop",
    type: "bike"
  },
  {
    id: "3",
    title: "Urban Scooter",
    description: "Zip through traffic with an urban scooter.",
    image: "https://images.unsplash.com/photo-1554223789-df81106a45ed?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    type: "scooter"
  }
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    id: "1",
    title: "Search",
    description: "Find the perfect vehicle for your needs.",
    icon: "search"
  },
  {
    id: "2",
    title: "Verify",
    description: "Complete a quick verification process.",
    icon: "check"
  },
  {
    id: "3",
    title: "Pay",
    description: "Securely pay for your rental online.",
    icon: "credit-card"
  },
  {
    id: "4",
    title: "Drive",
    description: "Enjoy your ride!",
    icon: "car"
  }
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sophia Clark",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    date: "2 months ago",
    quote: "Wheelify made renting a car so easy! The process was smooth, and the car was in excellent condition."
  },
  {
    id: "2",
    name: "Ethan Carter",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 4,
    date: "3 months ago",
    quote: "I rented a bike for a weekend trip, and it was fantastic. The bike was well-maintained, and the customer service was great."
  },
  {
    id: "3",
    name: "Olivia Reed",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    date: "4 months ago",
    quote: "Renting a scooter was a breeze. It was perfect for getting around the city, and the price was very reasonable."
  }
];

