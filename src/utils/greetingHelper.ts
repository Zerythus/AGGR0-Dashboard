// Determine time period based on current hour
function getTimePeriod(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'morning';
  } else if (hour < 18) {
    return 'afternoon';
  } else {
    return 'evening';
  }
}

// Get greeting based on time of day and user login count
export async function getRandomGreeting(
  username: string,
  loginCount: number = 1
): Promise<string> {
  try {
    const response = await fetch('/data/Greetings.json');
    const data = await response.json();
    const greetings: string[] = data.greetings;

    const timePeriod = getTimePeriod();
    const isReturningUser = loginCount > 1;

    // Pool all applicable greetings with equal priority
    let filteredGreetings: string[] = greetings.filter(g => {
      const greeting = g.replace('{username}', '').trim();
      
      // Always include time-based greetings
      if (greeting.startsWith(`Good ${timePeriod}`)) {
        return true;
      }
      // Always include "Hello" and "Welcome" (but not "Welcome back")
      if (greeting === 'Hello,' || greeting === 'Welcome,') {
        return true;
      }
      // Include "Welcome back" only for returning users
      if (isReturningUser && greeting === 'Welcome back,') {
        return true;
      }
      return false;
    });

    // Fallback to all greetings if nothing matches
    if (filteredGreetings.length === 0) {
      filteredGreetings = greetings;
    }

    // Pick random greeting from filtered list
    const randomGreeting = filteredGreetings[
      Math.floor(Math.random() * filteredGreetings.length)
    ];

    // Replace {username} placeholder with actual username
    return randomGreeting.replace('{username}', username);
  } catch (error) {
    console.error('Error fetching greetings:', error);
    return `Hello, ${username}!`;
  }
}
