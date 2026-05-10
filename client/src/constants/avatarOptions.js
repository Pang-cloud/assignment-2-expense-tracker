export const AVATAR_OPTIONS = [
  {
    value: "blue",
    label: "Blue",
  },
  {
    value: "purple",
    label: "Purple",
  },
  {
    value: "green",
    label: "Green",
  },
  {
    value: "orange",
    label: "Orange",
  },
  {
    value: "red",
    label: "Red",
  },
  {
    value: "navy",
    label: "Navy",
  },
];

export const getAvatarValue = (value) => {
  return AVATAR_OPTIONS.some((item) => item.value === value) ? value : "blue";
};
