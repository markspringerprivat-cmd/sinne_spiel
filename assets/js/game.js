const knight = document.getElementById('knight');
const locationText = document.getElementById('locationText');
const hotspots = document.querySelectorAll('.hotspot');

function moveKnightTo(button) {
  const x = button.dataset.targetX;
  const y = button.dataset.targetY;
  const area = button.dataset.area;
  knight.style.left = `${x}%`;
  knight.style.top = `${y}%`;
  locationText.textContent = `Der Ritter bewegt sich zum Gebiet: ${area}.`;
  localStorage.setItem('sinnesmagie-last-area', area);
  localStorage.setItem('sinnesmagie-knight-x', x);
  localStorage.setItem('sinnesmagie-knight-y', y);
}

hotspots.forEach(button => {
  button.addEventListener('click', () => moveKnightTo(button));
});

const savedX = localStorage.getItem('sinnesmagie-knight-x');
const savedY = localStorage.getItem('sinnesmagie-knight-y');
const savedArea = localStorage.getItem('sinnesmagie-last-area');
if (savedX && savedY) {
  knight.style.left = `${savedX}%`;
  knight.style.top = `${savedY}%`;
  locationText.textContent = savedArea ? `Der Ritter steht bei: ${savedArea}.` : 'Der Ritter steht auf der Karte.';
}
