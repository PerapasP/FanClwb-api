"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const posts = await prisma.posts.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: {
            post_id: true,
            content: true,
            fandom_id: true,
            artist_id: true,
            user_id: true,
            post_as_type: true,
            post_as_id: true,
        }
    });
    console.log(JSON.stringify(posts, null, 2));
}
main()
    .catch(e => console.error(e))
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=check-posts.js.map