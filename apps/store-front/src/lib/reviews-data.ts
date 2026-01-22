export type Review = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  date: string;
  verified: boolean;
  review: string;
  avatarColor: string;
  images?: string[];
};

export const reviewsData: Review[] = [
  {
    id: "1",
    name: "Sarah Mitchell",
    initials: "SM",
    rating: 5,
    date: "2 weeks ago",
    verified: true,
    review:
      "Absolutely love these! The quality is outstanding and they're incredibly comfortable. I've been wearing them daily for work and they still look brand new. The fit is perfect and the design is exactly as shown. Highly recommend!",
    avatarColor: "from-primary/20 to-accent/20",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
    ],
  },
  {
    id: "2",
    name: "James Davis",
    initials: "JD",
    rating: 4,
    date: "1 month ago",
    verified: true,
    review:
      "Great product overall! The build quality is solid and they feel premium. Only reason I'm giving 4 stars instead of 5 is because they took a couple of days to break in, but now they're super comfortable. Worth the price!",
    avatarColor: "from-blue-500/20 to-purple-500/20",
    images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop"],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    initials: "EM",
    rating: 5,
    date: "3 weeks ago",
    verified: true,
    review:
      "Perfect fit and amazing quality! I ordered my usual size and they fit like a glove. The material feels durable and the attention to detail is impressive. Shipping was fast and packaging was excellent. Will definitely order again!",
    avatarColor: "from-green-500/20 to-teal-500/20",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&h=400&fit=crop",
    ],
  },
  {
    id: "4",
    name: "Michael Wang",
    initials: "MW",
    rating: 4,
    date: "5 days ago",
    verified: true,
    review:
      "Very satisfied with my purchase! The product exceeded my expectations. Great value for money and the customer service was excellent when I had a question about sizing. They're comfortable, stylish, and well-made. Highly satisfied!",
    avatarColor: "from-orange-500/20 to-red-500/20",
    images: ["https://images.unsplash.com/photo-1605030753481-bb38b08c384a?w=400&h=400&fit=crop"],
  },
  {
    id: "5",
    name: "Lisa Thompson",
    initials: "LT",
    rating: 5,
    date: "1 week ago",
    verified: true,
    review:
      "These are fantastic! I've received so many compliments. The quality is top-notch and they're incredibly comfortable for all-day wear. The design is modern and versatile - goes with everything in my wardrobe. Already planning to order another pair!",
    avatarColor: "from-pink-500/20 to-rose-500/20",
    images: [
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=400&h=400&fit=crop",
    ],
  },
  {
    id: "6",
    name: "Robert Kim",
    initials: "RK",
    rating: 3,
    date: "2 months ago",
    verified: true,
    review:
      "Good product, but the sizing runs a bit small. I'd recommend going up half a size if you're between sizes. Quality is good and they look great, just wish I had ordered a size larger. Customer service was helpful with the exchange process.",
    avatarColor: "from-indigo-500/20 to-blue-500/20",
  },
  {
    id: "7",
    name: "Amanda Chen",
    initials: "AC",
    rating: 5,
    date: "4 days ago",
    verified: true,
    review:
      "Best purchase I've made this year! These are incredibly comfortable and stylish. I wear them everywhere - to work, casual outings, even light hiking. The quality is exceptional and they've held up perfectly. Worth every penny!",
    avatarColor: "from-cyan-500/20 to-blue-500/20",
    images: [
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1544966503-7cc49d0ee4c0?w=400&h=400&fit=crop",
    ],
  },
  {
    id: "8",
    name: "David Martinez",
    initials: "DM",
    rating: 5,
    date: "1 week ago",
    verified: true,
    review:
      "Excellent quality and perfect fit! I'm really impressed with the craftsmanship. The materials feel premium and they're very comfortable right out of the box. Great attention to detail. Highly recommend to anyone looking for quality footwear.",
    avatarColor: "from-emerald-500/20 to-green-500/20",
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop"],
  },
  {
    id: "9",
    name: "Jennifer Lee",
    initials: "JL",
    rating: 4,
    date: "3 weeks ago",
    verified: true,
    review:
      "Really nice product! The design is beautiful and they're quite comfortable. The only minor issue is that they're a bit narrow for my wide feet, but after breaking them in they've become much more comfortable. Overall very happy with the purchase.",
    avatarColor: "from-violet-500/20 to-purple-500/20",
    images: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop",
    ],
  },
  {
    id: "10",
    name: "Christopher Brown",
    initials: "CB",
    rating: 5,
    date: "6 days ago",
    verified: true,
    review:
      "Outstanding product! I've been wearing these for a week now and they're fantastic. The build quality is excellent, they're super comfortable, and they look great. I've already recommended them to several friends. Great value for the price!",
    avatarColor: "from-amber-500/20 to-orange-500/20",
    images: ["https://images.unsplash.com/photo-1605030753481-bb38b08c384a?w=400&h=400&fit=crop"],
  },
  {
    id: "11",
    name: "Maria Garcia",
    initials: "MG",
    rating: 5,
    date: "2 weeks ago",
    verified: true,
    review:
      "Love these so much! The quality is amazing and they're so comfortable. I've worn them for long days and my feet never hurt. The style is perfect and they go with everything. Already thinking about getting another color!",
    avatarColor: "from-fuchsia-500/20 to-pink-500/20",
    images: [
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1544966503-7cc49d0ee4c0?w=400&h=400&fit=crop",
    ],
  },
  {
    id: "12",
    name: "Thomas Anderson",
    initials: "TA",
    rating: 4,
    date: "1 month ago",
    verified: true,
    review:
      "Solid product with good quality. They're comfortable and look great. The only reason for 4 stars is that I wish they had a bit more cushioning for long walks, but for everyday use they're perfect. Good value overall.",
    avatarColor: "from-slate-500/20 to-gray-500/20",
    images: ["https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=400&h=400&fit=crop"],
  },
];
