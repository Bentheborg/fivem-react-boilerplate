// https://react-icons.github.io/react-icons/

import { IconType } from "react-icons";
import { FaBalanceScale, FaBomb, FaLaptop, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { GiHumanTarget, GiHeavyBullets, GiHeadshot, GiCrosshair, GiFire, GiBinoculars, GiShield, GiTank } from "react-icons/gi";
import { IoSkull } from "react-icons/io5";
import { LuGoal } from "react-icons/lu";
import { MdAssistWalker, MdHealthAndSafety } from "react-icons/md";
import { CiStopwatch } from "react-icons/ci";

const iconMap: Record<string, IconType> = {
    "fa FaBalanceScale": FaBalanceScale,
    "fa FaBomb": FaBomb,
    "fa FaLaptop": FaLaptop,
    "fa FaArrowUp": FaArrowUp,
    "fa FaArrowDown": FaArrowDown,
    "gi GiHumanTarget": GiHumanTarget,
    "gi GiHeavyBullets": GiHeavyBullets,
    "gi GiHeadshot": GiHeadshot,
    "gi GiCrosshair": GiCrosshair,
    "gi GiFire": GiFire,
    "gi GiBinoculars": GiBinoculars,
    "gi GiShield": GiShield,
    "gi GiTank": GiTank,
    "io5 IoSkull": IoSkull,
    "lu LuGoal": LuGoal,
    "md MdAssistWalker": MdAssistWalker,
    "md MdHealthAndSafety": MdHealthAndSafety,
    "ci CiStopwatch": CiStopwatch,
};

/**
 * Returns an icon component from react-icons based on a string input.
 * Example: getIcon("gi GiHumanTarget") -> returns GiHumanTarget component
 *
 * @param iconString The icon string in format "prefix Name" (e.g. "gi GiHumanTarget")
 * @returns The icon component or null if not found
 */
export const getIcon = (iconString: string): IconType | null => {
    return iconMap[iconString] || null;
};
