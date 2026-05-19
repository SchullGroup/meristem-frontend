export const formatCustomDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "-";

  const pad = (num: number) => String(num).padStart(2, "0");

  const day = pad(date.getDate());
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
};

export const formatDateOnly = (dateString: string | undefined): string => {
  if (!dateString) return "-";

  const parts = dateString.split("-");

  if (parts.length !== 3) return "Invalid Date";

  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parts[2];

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (monthIndex < 0 || monthIndex > 11) return "-";

  const month = months[monthIndex];

  return `${day} ${month} ${year}`;
};
