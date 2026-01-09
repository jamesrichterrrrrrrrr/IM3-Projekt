$(function () {
  const $carousels = $(".owl-carousel");
  if ($carousels.length === 0) return;

  $carousels.owlCarousel({
    loop: false,
    rewind: false,
    nav: true,
    dots: false,
    autoplay: false,

    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,

    responsive: {
      0: { items: 1.4, margin: 8 },
      600: { items: 2, margin: 12 },
      1000: { items: 3.5, margin: 16 }
    }
  });

  const SCROLL_THRESHOLD = 35;
  const GESTURE_END_MS = 120;

  $carousels.each(function () {
    const $carousel = $(this);

    let acc = 0;
    let timer = null;
    let locked = false;

    $carousel.on("wheel", ".owl-stage", function (e) {
      const oe = e.originalEvent;
      if (!oe) return;

      const dx = oe.deltaX || 0;
      const dy = oe.deltaY || 0;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absY > absX) return;

      e.preventDefault();

      const delta = absX >= 1 ? dx : dy;
      acc += delta;

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

        acc = 0;
        setTimeout(() => { locked = false; }, 200);
      }, GESTURE_END_MS);
    });
  });
});