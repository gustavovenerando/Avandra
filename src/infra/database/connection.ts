class DatabaseConnection{
    private static instance: DatabaseConnection;

    static getInstance(){
        if(!this.instance) return new DatabaseConnection();

        return this.instance;
    }

    private inicialize(){
        console.log("Inicializing");
    }
}
