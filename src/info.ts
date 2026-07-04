export function setupInfoDialog(): void {
  const button = document.getElementById("info-button");
  const dialog = document.getElementById("info-dialog");

  if (!(button instanceof HTMLButtonElement) || !(dialog instanceof HTMLDialogElement)) {
    return;
  }

  button.addEventListener("click", () => {
    dialog.showModal();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}
