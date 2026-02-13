import 'dotenv/config'

class AppConfig {
    static instance

    constructor() {
        if (AppConfig.instance) {
            return AppConfig.instance
        }

        this.app = {
            name: "EduConnect Backend",
            description: "",
            port: process.env.PORT || 3000
        }

        this.mongodb = {
            uri: process.env.CLOUSTER || ''
        }

        AppConfig.instance = this
    }
}

export default new AppConfig()