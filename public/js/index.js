import { showAlert } from './alert.js';
import { bookTour } from './stripe.js';

const logoutBtn = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');

if (logoutBtn) {
  logoutBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    try {
      const res = await axios({
        method: 'GET',
        url: 'http://127.0.0.1:3000/api/v1/users/logout',
      });

      if (res.data.status === 'success')
        setTimeout(() => location.assign('/'), 1500);
    } catch (err) {
      showAlert('error', 'Something went wrong. Try again');
    }
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
