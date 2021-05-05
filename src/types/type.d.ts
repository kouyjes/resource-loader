declare interface HTMLElement {
  parentNode;
  loadCallbacks?;
  type?;
  rel?;
  href?;
  src?;
  sheet?;
  onerror?: Function;
  onload?: Function;
}