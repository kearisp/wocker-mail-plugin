import {
    Description,
    Controller,
    Command,
    Param,
    Option
} from "@wocker/core";

import {ServiceType} from "../makes/Service";
import {MailService} from "../services/MailService";


@Controller()
export class MailController {
    public constructor(
        protected readonly mailService: MailService
    ) {}

    @Command("mail:ls")
    @Description("")
    public async list(): Promise<string> {
        return this.mailService.list();
    }

    @Command("mail:create [name]")
    @Description("")
    public async create(
        @Param("name")
        name?: string,
        @Option("type", {
            type: "string",
            alias: "t"
        })
        type?: ServiceType,
        @Option("image", {
            type: "string",
            alias: "i",
            description: ""
        })
        image?: string,
        @Option("image-version", {
            type: "string",
            alias: "I",
            description: ""
        })
        imageVersion?: string
    ): Promise<void> {
        await this.mailService.create(name, type, image, imageVersion);
    }

    @Command("mail:upgrade [name]")
    @Description("")
    public async upgrade(
        @Param("name")
        name?: string,
        @Option("type", {
            type: "string",
            alias: "t",
            description: ""
        })
        type?: ServiceType,
        @Option("image", {
            type: "string",
            alias: "i",
            description: ""
        })
        image?: string,
        @Option("image-version", {
            type: "string",
            alias: "I",
            description: ""
        })
        imageVersion?: string
    ): Promise<void> {
        await this.mailService.upgrade(name, type, image, imageVersion);
    }

    @Command("mail:destroy <name>")
    @Description("")
    public async destroy(
        @Param("name")
        name: string
    ): Promise<void> {
        await this.mailService.destroy(name);
    }

    @Command("mail:start [name]")
    public async start(
        @Param("name")
        name?: string,
        @Option("restart", {
            type: "boolean",
            alias: "r"
        })
        restart?: boolean
    ): Promise<void> {
        await this.mailService.start(name, restart);
    }

    @Command("mail:stop [name]")
    public async stop(
        @Param("name")
        name?: string
    ): Promise<void> {
        await this.mailService.stop(name);
    }
}
