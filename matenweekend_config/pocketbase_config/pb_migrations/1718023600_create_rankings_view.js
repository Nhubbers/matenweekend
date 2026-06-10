migrate((app) => {
    const collection = new Collection({
        id: "pbc_rankings_view",
        name: "rankings_view",
        type: "view",
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        options: {
            query: "SELECT u.id, u.name, u.avatar, COALESCE(SUM(pt.amount), 0) as totalPoints FROM users u LEFT JOIN point_transactions pt ON pt.user = u.id GROUP BY u.id"
        }
    });

    return app.save(collection);
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("rankings_view");
        return app.delete(collection);
    } catch (err) {
        return null;
    }
});
