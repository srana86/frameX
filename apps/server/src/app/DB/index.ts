import { USER_ROLE } from "../module/User/user.constant";
import { User } from "../module/User/user.model";

const superUser = {
    id: "0001",
    email: "admin@framex.com",
    password: "admin123",
    needsPasswordChange: false,
    role: USER_ROLE.superAdmin,
    status: "active",
    isDeleted: false,
};

const seedSuperAdmin = async () => {
    // when database is connected, we will check is there any user who is super admin
    const isSuperAdminExits = await User.findOne({ role: USER_ROLE.superAdmin });

    if (!isSuperAdminExits) {
        await User.create(superUser);
        console.log("✅ [Database] Super Admin seeded successfully");
    }
};

export default seedSuperAdmin;
