window.addEventListener('load', () => {

    // DRAG AND DROP
    jQuery(document).ready(function($) {
        $('.circle').draggable({
            containment: '.circle-group',
            scroll: false,
            stop: function(event, ui) {
                // Perform any necessary actions after dragging stops
            }
        });
    });

    // // 
    // const circles = document.querySelectorAll('.circle');

    // // Add mousemove event listener to circle elements
    // circles.forEach(circle => {
    //     circle.addEventListener('mousemove', function(event) {
    //         // Get mouse position relative to the circle
    //         const mouseX = event.clientX - circle.getBoundingClientRect().left;
    //         const mouseY = event.clientY - circle.getBoundingClientRect().top;

    //         // Calculate distance between mouse and circle center
    //         const distance = Math.sqrt(Math.pow((circle.offsetWidth / 2) - mouseX, 2) + Math.pow((circle.offsetHeight / 2) - mouseY, 2));

    //         // If the mouse comes within 75px of the circle-div
    //         if ( distance > 50) {
    //             // Calculate direction towards the mouse
    //             const dx = mouseX - circle.offsetWidth / 2;
    //             const dy = mouseY - circle.offsetHeight / 2;

    //             // Move the circle towards the mouse
    //             moveCircle(circle, dx, dy);
    //         }
    //     });
    // });

    // // Function to move the circle towards the mouse
    // function moveCircle(circle, dx, dy) {
    //     const speed = 22; // pixels per frame
    //     const angle = Math.atan2(dy, dx);
    //     const newX = circle.offsetLeft + speed * Math.cos(angle);
    //     const newY = circle.offsetTop + speed * Math.sin(angle);

    //     // Update circle position
    //     circle.style.left = newX + 'px';
    //     circle.style.top = newY + 'px';
    // }

})

