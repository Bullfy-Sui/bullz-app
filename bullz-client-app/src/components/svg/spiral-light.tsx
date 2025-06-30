import { motion } from "motion/react";

const SpiralLight = () => {
  return (
    <motion.svg
      initial={{ scale: 0 }}
      animate={{ scale: 1, rotate: 360 }}
      transition={{
        scale: { duration: 1, ease: "easeOut" },
        rotate: { repeat: Infinity, duration: 20, ease: "linear" },
      }}
      width="406"
      height="422"
      viewBox="0 0 406 422"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.6">
        <mask
          id="mask0_8580_10175"
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="16"
          width="406"
          height="406"
        >
          <circle
            cx="203"
            cy="219"
            r="203"
            fill="url(#paint0_radial_8580_10175)"
          />
        </mask>
        <g mask="url(#mask0_8580_10175)">
          <rect
            width="536.844"
            height="544.688"
            transform="translate(-65 -54)"
            fill="#F8DE4A"
            fill-opacity="0.3"
          />
          <path
            d="M150 -54H254L210.973 164H193.027L150 -54Z"
            fill="url(#paint1_linear_8580_10175)"
          />
          <path
            d="M150 490.688H254L210.973 272.688H193.027L150 490.688Z"
            fill="url(#paint2_linear_8580_10175)"
          />
          <path
            d="M358.149 -11L431.689 62.5391L247.114 186.263L234.425 173.574L358.149 -11Z"
            fill="url(#paint3_linear_8580_10175)"
          />
          <path
            d="M48.6953 -11L-24.8438 62.5391L159.73 186.263L172.42 173.574L48.6953 -11Z"
            fill="url(#paint4_linear_8580_10175)"
          />
          <path
            d="M358.149 447.688L431.689 374.149L247.114 250.425L234.425 263.114L358.149 447.688Z"
            fill="url(#paint5_linear_8580_10175)"
          />
          <path
            d="M48.6953 447.688L-24.8438 374.149L159.73 250.425L172.42 263.114L48.6953 447.688Z"
            fill="url(#paint6_linear_8580_10175)"
          />
          <path
            d="M471.844 170.844V274.844L253.844 231.817V213.872L471.844 170.844Z"
            fill="url(#paint7_linear_8580_10175)"
          />
          <path
            d="M-65 170.844V274.844L153 231.817V213.872L-65 170.844Z"
            fill="url(#paint8_linear_8580_10175)"
          />
        </g>
      </g>
      <defs>
        <radialGradient
          id="paint0_radial_8580_10175"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(203 219) rotate(90) scale(299.5)"
        >
          <stop offset="0.1" stop-color="white" />
          <stop offset="0.7" stop-color="white" stop-opacity="0" />
        </radialGradient>
        <linearGradient
          id="paint1_linear_8580_10175"
          x1="202"
          y1="-54"
          x2="202"
          y2="164"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FEE340" stop-opacity="0" />
          <stop offset="1" stop-color="#FEE340" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_8580_10175"
          x1="202"
          y1="490.688"
          x2="202"
          y2="272.688"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FEE340" stop-opacity="0" />
          <stop offset="1" stop-color="#FEE340" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_8580_10175"
          x1="394.919"
          y1="25.7696"
          x2="240.77"
          y2="179.919"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FEE340" stop-opacity="0" />
          <stop offset="1" stop-color="#FEE340" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_8580_10175"
          x1="11.9258"
          y1="25.7696"
          x2="166.075"
          y2="179.919"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FEE340" stop-opacity="0" />
          <stop offset="1" stop-color="#FEE340" />
        </linearGradient>
        <linearGradient
          id="paint5_linear_8580_10175"
          x1="394.919"
          y1="410.919"
          x2="240.77"
          y2="256.77"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FEE340" stop-opacity="0" />
          <stop offset="1" stop-color="#FEE340" />
        </linearGradient>
        <linearGradient
          id="paint6_linear_8580_10175"
          x1="11.9258"
          y1="410.919"
          x2="166.075"
          y2="256.77"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FEE340" stop-opacity="0" />
          <stop offset="1" stop-color="#FEE340" />
        </linearGradient>
        <linearGradient
          id="paint7_linear_8580_10175"
          x1="471.844"
          y1="222.844"
          x2="253.844"
          y2="222.844"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FEE340" stop-opacity="0" />
          <stop offset="1" stop-color="#FEE340" />
        </linearGradient>
        <linearGradient
          id="paint8_linear_8580_10175"
          x1="-65"
          y1="222.844"
          x2="153"
          y2="222.844"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FEE340" stop-opacity="0" />
          <stop offset="1" stop-color="#FEE340" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default SpiralLight;
