// A small static set of motivational quotes. We pick one deterministically per
// day so the dashboard shows a stable quote that changes each morning.
const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { text: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
  { text: 'Small deeds done are better than great deeds planned.', author: 'Peter Marshall' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'You don’t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'Do the hard jobs first. The easy jobs will take care of themselves.', author: 'Dale Carnegie' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
  { text: 'Either you run the day or the day runs you.', author: 'Jim Rohn' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
];

export function quoteForDate(iso: string) {
  // Sum the digits of the date to get a stable index for the day.
  const seed = iso.split('-').reduce((sum, part) => sum + Number(part), 0);
  return QUOTES[seed % QUOTES.length];
}
