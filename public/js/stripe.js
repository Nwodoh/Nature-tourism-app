const stripe = Stripe(
  'pk_test_51NhB52CApIvoAHVsIcqegrWNUTlCMvSMMEackQcOK2bWAxsQySZ8RFiLhCKD89QkWYqCVnD1w47GGY0hKmTDNW3W007NdecvQ4'
);

export const bookTour = async (tourId) => {
  const session = await fetch(
    `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
  ).then((res) => res.json());

  console.log(session);

  await stripe.redirectToCheckout({ sessionId: session.session.id });
  // if (session.status === 'success') location.replace(session.session.url);
};
