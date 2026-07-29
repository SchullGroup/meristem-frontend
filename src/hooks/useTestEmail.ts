import { useMutation } from "@tanstack/react-query";

import { SEND_TEST_EMAIL } from "@/actions/testEmailAction";

export const useSendTestEmail = () => {
  return useMutation({ mutationFn: SEND_TEST_EMAIL });
};
