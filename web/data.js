// web/data.js — real dead software (seed mirrors Sanity deceasedProject docs)
// Years verified against public sunset announcements. User additions merge via localStorage.
window.SEED_CORPSES = [
  { _id: 'flash', name: 'Adobe Flash Player', bornYear: 1996, diedYear: 2020, causeOfDeath: 'Zero-Day Vulnerability', status: 'haunting', vitalityScore: 22, flowersLeft: 128, epitaph: 'Blinking banners, Homestar Runner, and 20 years of patches.', successor: 'HTML5 video / Canvas' },
  { _id: 'ie', name: 'Internet Explorer', bornYear: 1995, diedYear: 2022, causeOfDeath: 'Framework Churn', status: 'ghost', vitalityScore: 40, flowersLeft: 96, epitaph: 'You were the way to download Chrome.', successor: 'Microsoft Edge' },
  { _id: 'netscape', name: 'Netscape Navigator', bornYear: 1994, diedYear: 2008, causeOfDeath: 'Framework Churn', status: 'peaceful_rest', vitalityScore: 8, flowersLeft: 45, epitaph: 'The browser war veteran. Mozilla rose from its ashes.', successor: 'Firefox' },
  { _id: 'silverlight', name: 'Microsoft Silverlight', bornYear: 2007, diedYear: 2021, causeOfDeath: 'Framework Churn', status: 'haunting', vitalityScore: 18, flowersLeft: 21, epitaph: 'Netflix once ran on me.', successor: 'HTML5' },
  { _id: 'angularjs', name: 'AngularJS 1.x', bornYear: 2010, diedYear: 2022, causeOfDeath: 'Framework Churn', status: 'ghost', vitalityScore: 45, flowersLeft: 64, epitaph: '$scope forever in our hearts.', successor: 'Angular 2+ / React / Vue' },
  { _id: 'atom', name: 'Atom Editor', bornYear: 2011, diedYear: 2022, causeOfDeath: 'Acquired and Murdered', status: 'ghost', vitalityScore: 52, flowersLeft: 88, epitaph: 'Hackable to the core. Sunset for VS Code.', successor: 'VS Code' },
  { _id: 'python2', name: 'Python 2', bornYear: 2000, diedYear: 2020, causeOfDeath: 'Framework Churn', status: 'fading', vitalityScore: 65, flowersLeft: 150, epitaph: 'print without parentheses. We miss you.', successor: 'Python 3' },
  { _id: 'winphone', name: 'Windows Phone', bornYear: 2010, diedYear: 2019, causeOfDeath: 'Framework Churn', status: 'ghost', vitalityScore: 33, flowersLeft: 57, epitaph: 'Live Tiles. Gone too soon.', successor: 'Android / iOS' },
  { _id: 'symbian', name: 'Symbian OS', bornYear: 1998, diedYear: 2013, causeOfDeath: 'Framework Churn', status: 'peaceful_rest', vitalityScore: 6, flowersLeft: 30, epitaph: 'Nokia\'s soul. Snake ran forever.', successor: 'Android / iOS' },
  { _id: 'msn', name: 'MSN / Windows Live Messenger', bornYear: 1999, diedYear: 2013, causeOfDeath: 'Acquired and Murdered', status: 'haunting', vitalityScore: 28, flowersLeft: 112, epitaph: 'Nudge. Winks. "xX_dark_angel_Xx is typing..."', successor: 'Skype' },
  { _id: 'yahoo-msg', name: 'Yahoo! Messenger', bornYear: 1998, diedYear: 2018, causeOfDeath: 'Maintainer Burnout', status: 'peaceful_rest', vitalityScore: 12, flowersLeft: 40, epitaph: 'LYCOS-era chatrooms and Buzzing.', successor: 'WhatsApp / Discord' },
  { _id: 'orkut', name: 'Orkut', bornYear: 2004, diedYear: 2014, causeOfDeath: 'Acquired and Murdered', status: 'peaceful_rest', vitalityScore: 10, flowersLeft: 35, epitaph: 'Brazil and India never forgot.', successor: 'Facebook / Google+' },
  { _id: 'googleplus', name: 'Google+', bornYear: 2011, diedYear: 2019, causeOfDeath: 'Vibe-Coded into Extinction', status: 'ghost', vitalityScore: 35, flowersLeft: 12, epitaph: 'Circles in the void.', successor: '—' },
  { _id: 'reader', name: 'Google Reader', bornYear: 2005, diedYear: 2013, causeOfDeath: 'Acquired and Murdered', status: 'haunting', vitalityScore: 25, flowersLeft: 143, epitaph: 'RSS died a little when you died.', successor: 'Feedly / Inoreader' },
  { _id: 'picasa', name: 'Picasa', bornYear: 2002, diedYear: 2016, causeOfDeath: 'Acquired and Murdered', status: 'ghost', vitalityScore: 38, flowersLeft: 49, epitaph: 'Face-tagging before it was cool.', successor: 'Google Photos' },
  { _id: 'inbox', name: 'Inbox by Gmail', bornYear: 2014, diedYear: 2019, causeOfDeath: 'Framework Churn', status: 'ghost', vitalityScore: 42, flowersLeft: 61, epitaph: 'Bundles and snoozes. Gmail absorbed your soul.', successor: 'Gmail' },
  { _id: 'vine', name: 'Vine', bornYear: 2012, diedYear: 2017, causeOfDeath: 'Acquired and Murdered', status: 'haunting', vitalityScore: 30, flowersLeft: 97, epitaph: '6 seconds. Infinite loops.', successor: 'TikTok' },
  { _id: 'hangouts', name: 'Google Hangouts (classic)', bornYear: 2013, diedYear: 2022, causeOfDeath: 'Framework Churn', status: 'fading', vitalityScore: 55, flowersLeft: 33, epitaph: 'Green chat bubble of chaos.', successor: 'Google Chat' },
];
window.SEED_EULOGIES = [
  { author: 'dev_2012', memory: 'I built my first client website in Flash in 2012.', project: 'flash' },
  { author: 'rss_fan', memory: 'Google Reader was my morning newspaper for 6 years.', project: 'reader' },
  { author: 'tile_lover', memory: 'Windows Phone UI was years ahead. Still miss Live Tiles.', project: 'winphone' },
];
window.CAUSES = ['Acquired and Murdered','Vibe-Coded into Extinction','Maintainer Burnout','Framework Churn','Rewritten in Rust (and never finished)','Zero-Day Vulnerability'];
