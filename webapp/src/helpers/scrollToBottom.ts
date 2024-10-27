// Sometimes when just calling scrollTo() once, it doesn't actually scroll to the bottom.
// This will attempt to do it multiple times until it reaches the bottom or times out
export function scrollToBottom(container, timeout = 1000): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    container.scrollTo({top: container.scrollHeight, behavior: 'instant'});

    function ensureScroll(): void {
      if (
        container.scrollTop + container.clientHeight < container.scrollHeight &&
        Date.now() - startTime < timeout
      ) {
        container.scrollTo({top: container.scrollHeight, behavior: 'instant'});
        requestAnimationFrame(ensureScroll);
      } else {
        resolve();
      }
    }

    ensureScroll();
  });
}
