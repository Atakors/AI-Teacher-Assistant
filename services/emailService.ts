// This service is disabled as the app now uses mailto: links for contact.
// This file can be removed if all references are updated.

export const sendEmail = async (from_name: string, from_email: string, subject: string, message: string): Promise<void> => {
  console.warn("sendEmail function is disabled. Using mailto: links instead.");
  // This function is now a no-op. It will do nothing.
  return Promise.resolve();
};
