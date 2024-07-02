import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
}

let cachedUser: User | null = null;

export function getCurrentUser(): User {
  // Return the cached user if it exists
  if (cachedUser !== null) {
    return cachedUser;
  }

  let user = localStorage.getItem('currentUser');

  if (!user) {
    const newUser = {
      id: uuidv4(), // Generate a UUID
    };

    localStorage.setItem('currentUser', JSON.stringify(newUser));
    cachedUser = newUser; // Cache the new user
    return newUser;
  }

  cachedUser = JSON.parse(user); // Cache the user from localStorage
  return cachedUser!;
}
