export const events = [
  {
    id: 1,
    name: "Taylor Swift | The Eras Tour",
    date: "Mar 15, 2025",
    time: "7:00 PM",
    venue: "SoFi Stadium, Los Angeles, CA",
    price: 250,
    category: "Music",
    icon: "🎤",
    featured: true,
    featuredBg: "linear-gradient(135deg, #4a0080 0%, #7b1fa2 100%)",
  },
  {
    id: 2,
    name: "NBA Finals 2025",
    date: "Jun 5, 2025",
    time: "8:00 PM",
    venue: "Chase Center, San Francisco, CA",
    price: 118,
    category: "Sports",
    icon: "🏀",
    featured: true,
    featuredBg: "linear-gradient(135deg, #0d1b4b 0%, #1a3a6b 100%)",
  },
  {
    id: 3,
    name: "Hamilton - The Musical",
    date: "Apr 20, 2025",
    time: "7:30 PM",
    venue: "Pantages Theatre, Hollywood, CA",
    price: 95,
    category: "Arts",
    icon: "🎭",
    featured: false,
    featuredBg: null,
  },
  {
    id: 4,
    name: "Coachella 2025",
    date: "Apr 11, 2025",
    time: "12:00 PM",
    venue: "Empire Polo Club, Indio, CA",
    price: 499,
    category: "Music",
    icon: "🎸",
    featured: false,
    featuredBg: null,
  },
  {
    id: 5,
    name: "Ed Sheeran World Tour",
    date: "May 3, 2025",
    time: "6:30 PM",
    venue: "Allegiant Stadium, Las Vegas, NV",
    price: 89,
    category: "Music",
    icon: "🎵",
    featured: false,
    featuredBg: null,
  },
];

export const tickets = [
  {
    id: 1,
    status: "upcoming",
    seat: "Section A, Row 5, Seat 12",
    event: events[0],
  },
  {
    id: 2,
    status: "upcoming",
    seat: "Floor Level, Row B",
    event: events[1],
  },
  {
    id: 3,
    status: "past",
    seat: "Orchestra, Row H",
    event: {
      ...events[2],
      date: "Jan 20, 2025",
      time: "7:30 PM",
    },
  },
];

export const recentSearches = [
  "Taylor Swift",
  "NBA Finals",
  "Coachella",
  "Hamilton - Musical",
];

export const categories = [
  { id: "all", name: "All", icon: "✨" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "arts", name: "Arts", icon: "🎨" },
  { id: "comedy", name: "Comedy", icon: "😂" },
  { id: "family", name: "Family", icon: "👨‍👩‍👧" },
  { id: "theater", name: "Theater", icon: "🎭" },
];

export const user = {
  name: "John Doe",
  email: "john.doe@email.com",
  initials: "JD",
  eventsCount: 12,
  ticketsCount: 5,
  favoritesCount: 8,
};
