import { SVGProps } from "react";

const ErrorExclamation = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 18.5V21.5H15V22.5H14V23.5H10V22.5H9V21.5H8V18.5H9V17.5H10V16.5H14V17.5H15V18.5H16Z"
        fill="#FF0000"
      />
      <path d="M10 8.5H9V1.5H15V8.5H14V14.5H10V8.5Z" fill="#FF0000" />
    </svg>
  );
};

export default ErrorExclamation;
