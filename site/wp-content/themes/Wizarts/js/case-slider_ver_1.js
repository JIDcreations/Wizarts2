//document.addEventListener("DOMContentLoaded", function () {
//   if (document.querySelector(".cross-sell-wrapper")) {
//     const slider = document.querySelector(".cross-sell-wrapper");
//     const slides = document.querySelectorAll(".cross-sell-wrapper > div");

//     if (slides.length > 3) {
//       let isDragging = false;
//       let startX = 0;
//       let currentTranslate = 0;

//       slider.addEventListener("mousedown", startDrag);
//       slider.addEventListener("touchstart", startDrag);

//       function startDrag(e) {
//         isDragging = true;
//         startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
//         currentTranslate = getTranslateX();

//         document.addEventListener("mousemove", handleDrag);
//         document.addEventListener("touchmove", handleDrag);

//         document.addEventListener("mouseup", stopDrag);
//         document.addEventListener("touchend", stopDrag);
//       }

//       function stopDrag() {
//         if (isDragging) {
//           isDragging = false;
//           document.removeEventListener("mousemove", handleDrag);
//           document.removeEventListener("touchmove", handleDrag);
//           document.removeEventListener("mouseup", stopDrag);
//           document.removeEventListener("touchend", stopDrag);
//         }
//       }

//       function handleDrag(e) {
//         if (isDragging) {
//           const x = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
//           const deltaX = x - startX;
//           const translateX = currentTranslate + deltaX;

//           const maxTranslateX = 0;
//           const minTranslateX = slider.clientWidth - slider.scrollWidth;

//           const lastItem = slider.querySelector(".single-project-block:last-child");
//           const lastItemPosition = lastItem.getBoundingClientRect().right;

//           const adjustedMaxTranslateX = Math.min(0, translateX);
//           const adjustedMinTranslateX = Math.max(minTranslateX, translateX);

//           if (lastItemPosition <= slider.clientWidth && deltaX < 0) {
//             setTranslateX(adjustedMaxTranslateX);
//           } else {
//             setTranslateX(translateX);
//           }
//         }
//       }

//       function getTranslateX() {
//         const style = window.getComputedStyle(slider);
//         const matrix = new DOMMatrix(style.transform);
//         return matrix.m41;
//       }

//       function setTranslateX(translateX) {
//         slider.style.transform = `translateX(${translateX}px)`;
//       }

//       // Use requestAnimationFrame for continuous update
//       function update() {
//         updateSliderWidth();
//         requestAnimationFrame(update);
//       }

//       // Recalculate the width of the slider based on the number of items
//       function updateSliderWidth() {
//         const sliderWidth = slides.length * parseFloat(getComputedStyle(slides[0]).width) +
//           (slides.length - 1) * parseFloat(getComputedStyle(slider).gap);
//         slider.style.width = `${sliderWidth}px`;
//       }

//       // Initial update of slider width
//       update();

//       // Update slider width on window resize
//       window.addEventListener("resize", updateSliderWidth);
//     }
//   }
// });


// /* SLIDER SELL */
// document.addEventListener("DOMContentLoaded", function () {
// 	if(document.querySelector(".slider")){
// 		if(document.querySelectorAll(".slider > div").length > 3){
// 		  const slider = document.querySelector(".slider");
// 		  let isDragging = false;
// 		  let startX = 0;
// 		  let currentTranslate = 0;

// 		  document.addEventListener("mousedown", startDrag);
// 		  document.addEventListener("touchstart", startDrag);

// 		  function startDrag(e) {
// 			const target = e.target;

// 			// Check if the event originated within the slider or its slides
// 			if (target === slider || slider.contains(target)) {
// 			  isDragging = true;
// 			  startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;

// 			  document.addEventListener("mousemove", handleDrag);
// 			  document.addEventListener("touchmove", handleDrag);

// 			  document.addEventListener("mouseup", stopDrag);
// 			  document.addEventListener("touchend", stopDrag);

// 			  // Prevent default to avoid unwanted selection during dragging
// 			  e.preventDefault();
// 			}
// 		  }

// 		  function stopDrag() {
// 			isDragging = false;

// 			document.removeEventListener("mousemove", handleDrag);
// 			document.removeEventListener("touchmove", handleDrag);
// 			document.removeEventListener("mouseup", stopDrag);
// 			document.removeEventListener("touchend", stopDrag);
// 		  }

// 		  function handleDrag(e) {
// 			if (isDragging) {
// 			  const x = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
// 			  const deltaX = x - startX;

// 			  currentTranslate += deltaX;

// 			  requestAnimationFrame(() => {
// 				slider.style.transform = `translateX(${currentTranslate}px)`;
// 			  });

// 			  startX = x;
// 			}
// 		  }
		
// 		}
// 	}
// });
