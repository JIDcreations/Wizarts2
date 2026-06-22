
document.addEventListener('DOMContentLoaded', () => {

    let button = document.querySelector('.mobile-nav .button');
    let menu = document.querySelector('header > .mobile-menu');
    let body = document.querySelector('body');

    button.addEventListener('click', () => {
        menu.classList.toggle('active');
        body.classList.toggle('active-mobile');
    })
});

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('video').forEach(function(video) {
    video.setAttribute('playsinline', '');
  });
});
