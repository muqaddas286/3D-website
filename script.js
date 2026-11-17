(() => {
  'use strict';

  const stage = document.getElementById('stage');
  const video = document.getElementById('headVideo');
  const helmet = document.getElementById('helmet');
  const button = document.getElementById('pushButton');

  const ring = document.getElementById('cursorRing');
  const dot = document.getElementById('cursorDot');

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const finePointer = window.matchMedia(
    '(pointer: fine)'
  ).matches;

  const FRAME_WIDTH = 1440;
  const FRAME_HEIGHT = 810;

  let duration = 5.04;
  let targetTime = duration / 2;
  let shownTime = duration / 2;

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  let ringX = pointerX;
  let ringY = pointerY;

  let lastMovement = performance.now();
  let animationStarted = false;
  let helmetEnabled = false;
  let seeking = false;
  let videoReady = false;

  /* Frame coordinate conversion */

  function getFrameCoordinates(clientX, clientY) {
    const u = Math.max(
      window.innerWidth / FRAME_WIDTH,
      window.innerHeight / FRAME_HEIGHT
    );

    const frameLeft = window.innerWidth / 2 - 720 * u;
    const frameTop = window.innerHeight / 2 - 405 * u;

    return {
      x: (clientX - frameLeft) / u,
      y: (clientY - frameTop) / u
    };
  }

  /* Cursor and gaze input */

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;

    lastMovement = performance.now();

    if (!finePointer) return;

    dot.style.left = pointerX + 'px';
    dot.style.top = pointerY + 'px';
  }, { passive: true });

  /* Interactive cursor hover */

  button.addEventListener('pointerenter', () => {
    ring.classList.add('hover');
  });

  button.addEventListener('pointerleave', () => {
    ring.classList.remove('hover');
  });

  /* Custom cursor animation */

  function animateCursor() {
    if (finePointer) {
      ringX += (pointerX - ringX) * .55;
      ringY += (pointerY - ringY) * .55;

      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
    }

    requestAnimationFrame(animateCursor);
  }

  if (finePointer) {
    animateCursor();
  }

  /* Load entire video into memory */

  async function loadHeadVideo() {
    if (reducedMotion) return;

    const videoURL =
      'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e1b48476-24ab-456a-bb12-13e63bc60973.mp4';

    try {
      const response = await fetch(videoURL);

      if (!response.ok) {
        throw new Error('Video fetch failed');
      }

      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);

      video.src = objectURL;
    } catch (error) {
      console.warn(
        'Using direct video URL fallback:',
        error
      );

      video.src = videoURL;
    }

    video.load();

    await new Promise((resolve) => {
      if (video.readyState >= 1) {
        resolve();
      } else {
        video.addEventListener('loadedmetadata', resolve, {
          once: true
        });
      }
    });

    if (Number.isFinite(video.duration)) {
      duration = video.duration;
    }

    targetTime = duration / 2;
    shownTime = duration / 2;

    videoReady = true;

    video.pause();

    /* First seek reveals the video */
    video.currentTime = 0;

    video.addEventListener('seeked', () => {
      video.classList.add('ready');
    }, { once: true });
  }

  /* Head tracking */

  function animateHead() {
    if (!videoReady || reducedMotion) {
      requestAnimationFrame(animateHead);
      return;
    }

    const now = performance.now();

    const idleTime = now - lastMovement;

    if (idleTime > 3500) {
      const drift = Math.sin(now * .00045) * .32;

      targetTime = duration / 2 + drift * (duration / 2);
    } else {
      const coords = getFrameCoordinates(
        pointerX,
        pointerY
      );

      const normalized = Math.min(
        1,
        Math.max(
          0,
          (coords.x - FRAME_WIDTH * .14) /
          (FRAME_WIDTH * .72)
        )
      );

      targetTime = normalized * duration;
    }

    shownTime += (targetTime - shownTime) * .14;

    if (!video.seeking) {
      const difference = Math.abs(
        video.currentTime - shownTime
      );

      if (difference > .012) {
        video.currentTime = Math.min(
          duration - .001,
          Math.max(0, shownTime)
        );
      }
    }

    requestAnimationFrame(animateHead);
  }

  /* Helmet interaction */

  function toggleHelmet() {
    helmetEnabled = !helmetEnabled;

    button.setAttribute(
      'aria-pressed',
      String(helmetEnabled)
    );

    button.classList.toggle(
      'helmet-on',
      helmetEnabled
    );

    /* Retrigger button press */
    button.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(.88)' },
        { transform: 'scale(1)' }
      ],
      {
        duration: 320,
        easing: 'cubic-bezier(.2,.8,.3,1)'
      }
    );

    helmet.classList.remove('active', 'removing');

    if (helmetEnabled) {
      helmet.classList.add('active');
    } else {
      helmet.classList.add('removing');

      helmet.addEventListener('animationend', () => {
        if (!helmetEnabled) {
          helmet.style.visibility = 'hidden';
          helmet.classList.remove('removing');
        }
      }, { once: true });
    }
  }

  button.addEventListener('click', toggleHelmet);

  /* Cinematic entrance */

  function runEntrance() {
    if (reducedMotion || animationStarted) return;

    animationStarted = true;

    const timeline = [
      {
        selector: '.logo',
        delay: 0,
        duration: 700,
        from: {
          opacity: 0,
          transform: 'translateY(-25px)'
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)'
        }
      },
      {
        selector: '.menu',
        delay: 100,
        duration: 650,
        from: {
          opacity: 0,
          transform: 'translateY(-20px)'
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)'
        }
      },
      {
        selector: '.eyebrow',
        delay: 300,
        duration: 700,
        from: {
          opacity: 0,
          letterSpacing: '.9em'
        },
        to: {
          opacity: 1,
          letterSpacing: '.46em'
        }
      },
      {
        selector: '.headline',
        delay: 450,
        duration: 1000,
        from: {
          opacity: 0,
          transform: 'translateY(35px)',
          filter: 'blur(14px)'
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)',
          filter: 'blur(0)'
        }
      },
      {
        selector: '.subtitle',
        delay: 850,
        duration: 750,
        from: {
          opacity: 0,
          transform: 'translateY(12px)'
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)'
        }
      },
      {
        selector: '.caption.left',
        delay: 1050,
        duration: 700,
        from: {
          opacity: 0,
          transform: 'translateY(10px)'
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)'
        }
      },
      {
        selector: '.caption.right',
        delay: 1100,
        duration: 700,
        from: {
          opacity: 0,
          transform: 'translateY(10px)'
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)'
        }
      },
      {
        selector: '.push-button',
        delay: 1250,
        duration: 600,
        from: {
          opacity: 0,
          transform: 'scale(.4)'
        },
        to: {
          opacity: 1,
          transform: 'scale(1)'
        }
      }
    ];

    timeline.forEach((item) => {
      const element = document.querySelector(
        item.selector
      );

      element.animate(
        [item.from, item.to],
        {
          duration: item.duration,
          delay: item.delay,
          fill: 'forwards',
          easing: 'cubic-bezier(.22, 1, .36, 1)'
        }
      );
    });
  }

  /* Initialize */

  async function init() {
    if (reducedMotion) {
      document.querySelectorAll(
        '.logo, .menu, .eyebrow, .headline, .subtitle, .caption, .push-button'
      ).forEach(element => {
        element.style.opacity = '1';
        element.style.transform = 'none';
        element.style.filter = 'none';
      });

      return;
    }

    runEntrance();

    loadHeadVideo().then(() => {
      requestAnimationFrame(animateHead);
    });
  }

  init();

})();