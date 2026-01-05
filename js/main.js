$(function () {
  const $carousels = $(".owl-carousel");
  if ($carousels.length === 0) return;

  // 1) Init OwlCarousel (no loop, fixed spacing)
  $carousels.owlCarousel({
    loop: false,     // start/end (chronological makes sense)
    rewind: false,   // don't jump back to start
    nav: true,
    dots: false,
    autoplay: false,

    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,

    responsive: {
      0:    { items: 1.4, margin: 8 },
      600:  { items: 2,   margin: 12 },
      1000: { items: 3.5, margin: 16 }
    }
  });

  // 2) Trackpad two-finger swipe (wheel gesture) -> exactly ONE prev/next per gesture
  //    Approach: accumulate wheel deltas + debounce (gesture ends -> one move)
  const SCROLL_THRESHOLD = 35;   // higher = less sensitive
  const GESTURE_END_MS = 120;    // debounce window

  $carousels.each(function () {
    const $carousel = $(this);

    let acc = 0;         // accumulated horizontal intent
    let timer = null;    // debounce timer
    let locked = false;  // prevents double triggers inside one gesture

    $carousel.on("wheel", ".owl-stage", function (e) {
      const oe = e.originalEvent;
      if (!oe) return;

      const dx = oe.deltaX || 0;
      const dy = oe.deltaY || 0;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // If user is mostly scrolling vertically, let the page scroll normally
      if (absY > absX) return;

      // We're handling horizontal swipe -> prevent page from scrolling
      e.preventDefault();

      // Some systems report horizontal trackpad gesture via deltaY too.
      // Prefer deltaX if present; fall back to deltaY.
      const delta = absX >= 1 ? dx : dy;

      // Accumulate intent
      acc += delta;

      // Debounce: when gesture stops, do ONE move
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        if (locked) return;

        if (acc > SCROLL_THRESHOLD) {
          $carousel.trigger("next.owl.carousel");
          locked = true;
        } else if (acc < -SCROLL_THRESHOLD) {
          $carousel.trigger("prev.owl.carousel");
          locked = true;
        }

        // Reset for next gesture
        acc = 0;

        // Unlock shortly after movement so next gesture can act
        setTimeout(() => { locked = false; }, 200);
      }, GESTURE_END_MS);
    });
  });
});