import { showAlert } from './alert.js';

const nameAndEmailForm = document.getElementById('nameAndEmailForm');
const passwordForm = document.getElementById('passwordForm');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const photoInput = document.getElementById('photo');
const formUserPhoto = document.getElementById('formUserPhoto');
const navUserPhoto = document.getElementById('navUserPhoto');

async function updateData(dataObj, route) {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/${route}`,
      data: dataObj,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Update successfull');
      return true;
    } else throw new Error(res.message);
  } catch (err) {
    showAlert('error', err ? err : 'Error updating your data');
    return false;
  }
}

photoInput.addEventListener('change', (e) => {
  e.preventDefault();
  if (photoInput.files.length < 1) return;

  formUserPhoto.src = URL.createObjectURL(photoInput.files[0]);
  navUserPhoto.src = URL.createObjectURL(photoInput.files[0]);
});

nameAndEmailForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = new FormData();

  form.append('name', nameInput.value);
  form.append('email', emailInput.value);
  form.append('photo', photoInput.files[0]);

  await updateData(form, 'update-me');
});

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const saveBtn = document.getElementById('savePasswordBtn');
  saveBtn.textContent = 'Updating...';
  const password = document.getElementById('password-current').value;
  const newPassword = document.getElementById('password').value;
  const newPasswordConfirm = document.getElementById('password-confirm').value;
  const dataObj = JSON.stringify({ password, newPassword, newPasswordConfirm });

  if (newPassword !== newPasswordConfirm)
    return showAlert('error', 'Your passwords do not match');

  const isSuccessfull = await updateData(dataObj, 'update-password');

  if (isSuccessfull) {
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    saveBtn.textContent = 'Successful ✅';
  } else {
    saveBtn.textContent = 'Error ❕❗❕❗';
  }
  setTimeout(() => (saveBtn.textContent = 'Save password'), 5000);
});
