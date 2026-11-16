/**
 * Text of the quote page (/quote/). Edit the words here.
 * Kept in its own file so the other pages do not download it. Nothing here promises a reply time, a price or a lead time.
 */
export const wizard = {
  heading: "Get a quote",
  lead: "Five short steps. You choose how to send it: on WhatsApp, by email, or (when the site is connected to a form service) straight from this page.",
  steps: ["Product and size", "Material and finishes", "Artwork", "Your details", "Review and send"],
  artwork: "Please send your artwork on WhatsApp or by email after you send this request. Do not paste files here: this form only takes text.",
  noPriceNote: "We do not show prices here. A quote is made after we see what you need.",
  privacy: {
    title: "Privacy",
    sent: "What you type in this form is put into one message with the details you chose. It goes only to us: to our WhatsApp number or email address if you press those buttons",
    sentForm: ", or to our form service if you press Send request",
    stored: ". This website does not store it. A draft is kept in your own browser (on this device only) so you do not lose it, and it is deleted after you send.",
  },
  /** Shown after "Send request" worked. TODO(owner): add a real reply time ONLY if you can keep it. It is left out on purpose. */
  success: {
    title: "Thank you. We have your request.",
    body: "We will contact you using the method you chose. Please also send your artwork on WhatsApp or by email.",
  },
  /** TODO(owner): your wording. */
  error: "The request could not be sent from this page. Nothing is lost: please use the WhatsApp or email button instead.",
  tooFast: "That was very quick. Please check your details and press send again in a moment.",
};
