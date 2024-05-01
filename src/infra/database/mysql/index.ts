class MySqlConn{
    private config: any;

    constructor(config: any){
        this.config = config;
    }

    private connection(){
        const uri = this.uriMaker();

        // const conn = new Sequelize(uri);
    }

    private uriMaker(){
        const {
            host,
            user,
            password,
            name,
            dialect,
            port
        } = this.config;

        return `${dialect}://${user}:${password}@${host}:${port}/${name}`
    }
}
