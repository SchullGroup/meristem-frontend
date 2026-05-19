// /**
//  * Returns an appropriate error message based on the provided error object.
//  * @param {Error} error - The error object containing details about the encountered error.
//  * @returns {string} An error message corresponding to the type of error encountered.
//  */
// export const returnErrorMessage = (error) => {
//   const errorStatus = error?.response?.status;
//   if (error?.message === "Network error") {
//     return "It looks like you are offline..., pls check your internet connection";
//   } else if (errorStatus >= 400 && errorStatus <= 500) {
//     return error?.response?.data?.message ?? error?.response?.data;
//   } else {
//     return error?.message ?? "Something went wrong, please try again later...";
//   }
// };

export type ErrorLike = {
  message?: string;
  response?: {
    status?: number;
    data?: unknown;
  };
  isSuccessful?: false;
  responseMessage?: string;
  responseCode?: number | null;
  time?: string;
};

/**
 * Returns an appropriate error message based on the provided error object.
 */
export const returnErrorMessage = (error: ErrorLike): string => {
  const errorStatus = error?.response?.status;

  if (error?.message === "Network error") {
    return "It looks like you are offline..., please check your internet connection";
  } else if (errorStatus && errorStatus >= 400) {
    const data = error?.response?.data;

    if (data && typeof data === "object") {
      // Try to extract the main error message from common response structures
      return (
        (data as { message?: string }).message ??
        (data as { error?: string }).error ??
        (data as { responseMessage?: string }).responseMessage ??
        "An error occurred"
      );
    }

    return String(data ?? "An error occurred");
  } else {
    return error?.message ?? "Something went wrong, please try again later...";
  }
};
