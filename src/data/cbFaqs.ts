import type { FAQ } from "@/components/seo/CBStructuredData";

// Crazy Bear voice. Short. Confident. No fluff.
export const cbFaqs: Record<string, { title?: string; faqs: FAQ[] }> = {
  "/town": {
    title: "Town. Asked and answered.",
    faqs: [
      {
        question: "Where is Crazy Bear Town?",
        answer: "75 Wycombe End, Beaconsfield, Buckinghamshire HP9 1LX. Old town. Almost London.",
      },
      {
        question: "What is here?",
        answer: "Three restaurants, two bars, signature bedrooms and a hidden pool.",
      },
      {
        question: "Is there parking?",
        answer: "Yes. On site, for guests and diners.",
      },
      {
        question: "Dogs?",
        answer: "Sorry, no dogs in Town , but our Sister Bear in the Country LOVES them.",
      },
      {
        question: "Check in and out?",
        answer: "Check in from 3pm. Check out by 11am.",
      },
      {
        question: "Dress code?",
        answer: "As per the House Rules, dress like your ex is watching.",
      },
    ],
  },
  "/town/rooms": {
    title: "Rooms. Asked and answered.",
    faqs: [
      {
        question: "How many rooms?",
        answer: "Signature bedrooms across the townhouse. Each one its own world.",
      },
      {
        question: "What makes a Crazy Bear room?",
        answer: "Velvet, mirror, marble. Theatrical. Indulgent. Never the same twice.",
      },
      {
        question: "Family rooms?",
        answer: "Selected rooms suit families. Ask when booking.",
      },
      {
        question: "Accessibility?",
        answer: "Some rooms are step free. Call us and we will match the room to you.",
      },
      {
        question: "Breakfast included?",
        answer: "Yes. Served in the B&B downstairs.",
      },
    ],
  },
  "/town/food": {
    title: "Food. Asked and answered.",
    faqs: [
      {
        question: "Which restaurants are at Town?",
        answer: "The Black Bear, the B&B and Hom Thai. Two kitchens, three rooms, one appetite.",
      },
      {
        question: "Do I need to book?",
        answer: "Always book. Walk ins only when there is room.",
      },
      {
        question: "Private dining?",
        answer: "Yes. Small rooms to the whole house.",
      },
      {
        question: "Dietary requirements?",
        answer: "Tell us when you book. We will look after you.",
      },
    ],
  },
  "/town/drink": {
    title: "Drink. Asked and answered.",
    faqs: [
      {
        question: "Walk in for a drink?",
        answer: "Yes. The bars are open to all.",
      },
      {
        question: "Cocktails?",
        answer: "Stirred with intent. Served without apology.",
      },
      {
        question: "Wine list?",
        answer: "Long, considered, fairly priced.",
      },
    ],
  },
  "/town/drink/cocktails": {
    title: "Cocktails. Asked and answered.",
    faqs: [
      {
        question: "Where is the cocktail bar?",
        answer: "Mirrored walls, low light, ground floor at Town.",
      },
      {
        question: "Booking needed?",
        answer: "Walk ins welcome. Book a table for groups.",
      },
      {
        question: "Late?",
        answer: "Open late on weekends. Last orders by request.",
      },
    ],
  },
  "/town/pool": {
    title: "Pool. Asked and answered.",
    faqs: [
      {
        question: "Who can use the pool?",
        answer: "Hotel guests only.",
      },
      {
        question: "Opening hours?",
        answer: "Daytime, every day. Heated.",
      },
      {
        question: "Children?",
        answer: "Yes, with an adult.",
      },
    ],
  },
  "/country": {
    title: "Country. Asked and answered.",
    faqs: [
      {
        question: "Where is Crazy Bear Country?",
        answer: "Bear Lane, Stadhampton, Oxfordshire OX44 7UR. The original Crazy Bear.",
      },
      {
        question: "How old is it?",
        answer: "16th century inn. Older bones than most.",
      },
      {
        question: "Parking?",
        answer: "Yes. Free, on site.",
      },
      {
        question: "Dogs?",
        answer: "Welcome in the pub and selected rooms. Call ahead.",
      },
      {
        question: "Check in and out?",
        answer: "Check in from 3pm. Check out by 11am.",
      },
    ],
  },
  "/country/rooms": {
    title: "Rooms. Asked and answered.",
    faqs: [
      {
        question: "What kind of rooms?",
        answer: "Theatrical. Indulgent. Never the same twice.",
      },
      {
        question: "Pets?",
        answer: "Selected rooms accept dogs. Ask when booking.",
      },
      {
        question: "Accessibility?",
        answer: "Ground floor rooms available. Call us first.",
      },
      {
        question: "Breakfast?",
        answer: "Yes. Included.",
      },
    ],
  },
  "/country/pub": {
    title: "The Pub. Asked and answered.",
    faqs: [
      {
        question: "Food service times?",
        answer: "Lunch and dinner, every day. Bar snacks between.",
      },
      {
        question: "Walk ins?",
        answer: "Welcome. Booking advised at weekends.",
      },
      {
        question: "Dogs in the pub?",
        answer: "Always.",
      },
      {
        question: "Sunday roast?",
        answer: "Yes. Book ahead.",
      },
    ],
  },
  "/country/events": {
    title: "Events. Asked and answered.",
    faqs: [
      {
        question: "What can you host?",
        answer: "Private rooms, marquee, exclusive use of the whole house.",
      },
      {
        question: "Capacity?",
        answer: "Intimate dinners up to several hundred under canvas.",
      },
      {
        question: "How do I enquire?",
        answer: "Tell us the date, the numbers and the mood. We will reply fast.",
      },
    ],
  },
  "/country/events/weddings": {
    title: "Weddings. Asked and answered.",
    faqs: [
      {
        question: "Civil ceremonies?",
        answer: "Yes. Licensed for ceremonies on site.",
      },
      {
        question: "How many guests?",
        answer: "Small and intimate to several hundred under the marquee.",
      },
      {
        question: "Exclusive use?",
        answer: "Available. Whole house, your weekend.",
      },
      {
        question: "Accommodation?",
        answer: "Rooms on site, plus more nearby.",
      },
    ],
  },
  "/country/events/birthdays": {
    title: "Birthdays. Asked and answered.",
    faqs: [
      {
        question: "Group sizes?",
        answer: "From a long table to the whole place.",
      },
      {
        question: "Late licence?",
        answer: "Yes, by arrangement.",
      },
      {
        question: "Stay over?",
        answer: "Rooms on site. Book early.",
      },
    ],
  },
  "/country/events/business": {
    title: "Business. Asked and answered.",
    faqs: [
      {
        question: "Meeting rooms?",
        answer: "Private rooms for boardroom to away day.",
      },
      {
        question: "Day delegate rates?",
        answer: "Yes. Tailored to the day.",
      },
      {
        question: "Stay over?",
        answer: "Bedrooms on site. Dinner sorted.",
      },
    ],
  },
  "/country/parties": {
    title: "Parties. Asked and answered.",
    faqs: [
      {
        question: "What kind of parties?",
        answer: "Loud, long, late.",
      },
      {
        question: "Group size?",
        answer: "From a corner to the whole house.",
      },
      {
        question: "Late licence?",
        answer: "Yes, by arrangement.",
      },
    ],
  },
};
