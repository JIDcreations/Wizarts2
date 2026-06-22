window.addEventListener('load', () => {
    if(document.querySelector('.projecten-buttons')){
        var lastPart = window.location.href.split("/").filter(n => n).pop();
        let activeButton = document.querySelector(`.${lastPart}`);
        activeButton.classList.add('active');
        
    }


	
	
})


document.addEventListener("DOMContentLoaded", function () {
	const banner = document.querySelector('.banner');
	if (!banner) return;

	// Dupliceer de inhoud zodat het naadloos kan scrollen
	banner.innerHTML += banner.innerHTML;
	banner.innerHTML += banner.innerHTML;

	let offset = 0;
	const speed = 1; // pas aan voor sneller/langzamer

	function animate() {
		offset += speed;
		// Reset wanneer helft van de scroll gepasseerd is
		if (offset >= banner.scrollWidth / 2) {
			offset = 0;
		}
		banner.style.transform = `translateX(-${offset}px)`;
		requestAnimationFrame(animate);
	}

	animate();
});


// document.addEventListener("DOMContentLoaded", function () {
// 	const scroller = document.querySelector(".projecten-wrapper");

// 	if (scroller) {
// 		scroller.addEventListener("wheel", function (e) {
// 			if (e.deltaY === 0) return;
// 			e.preventDefault();
// 			scroller.scrollBy({
// 				left: e.deltaY,
// 				behavior: "smooth"
// 			});
// 		}, { passive: false });
// 	}
// });
