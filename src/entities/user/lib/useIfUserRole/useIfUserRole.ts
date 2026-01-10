import {ROLES} from "@/entities/user/types/userState";
import {isEmpty, isNull} from "lodash";
import {useUserStore} from "@/entities/user/model/slice/userStore";

export const useIfUserRole = () => {
    const user = useUserStore(state => state.user);
    if (isNull(user) || isEmpty(user.roles)) {
        return {
            isUser: false,
            isAdmin: false,
            isService: false,
        };
    }

    return {
        isUser: user.roles.some(item => item.value === ROLES.USER) || false,
        isService: user.roles.some(item => item.value === ROLES.SERVICE) || false,
        isAdmin: user.roles.some(item => item.value === ROLES.ADMIN) || false,
    };
};