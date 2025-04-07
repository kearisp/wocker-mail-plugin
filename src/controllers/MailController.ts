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
    @Description("Displays a list of mail services, including name, type, container, and image details.")
    public async list(): Promise<string> {
        return this.mailService.list();
    }

    @Command("mail:create [name]")
    @Description("Creates a new mail service.")
    public async create(
        @Param("name")
        name?: string,
        @Option("type", {
            type: "string",
            alias: "t",
            description: "Service type. Choose between `MAILDEV` or `MAILHOG`"
        })
        type?: ServiceType,
        @Option("image", {
            type: "string",
            alias: "i",
            description: "Custom Docker image to use."
        })
        image?: string,
        @Option("image-version", {
            type: "string",
            alias: "I",
            description: "Custom image version to use."
        })
        imageVersion?: string
    ): Promise<void> {
        await this.mailService.create(name, type, image, imageVersion);
    }

    @Command("mail:upgrade [name]")
    @Description("Upgrade email service configuration.")
    public async upgrade(
        @Param("name")
        name?: string,
        @Option("type", {
            type: "string",
            alias: "t",
            description: "Set service type (`MAILDEV` or `MAILHOG`)."
        })
        type?: ServiceType,
        @Option("image", {
            type: "string",
            alias: "i",
            description: "Specify custom Docker image."
        })
        image?: string,
        @Option("image-version", {
            type: "string",
            alias: "I",
            description: "Specify Docker image version."
        })
        imageVersion?: string
    ): Promise<void> {
        await this.mailService.upgrade(name, type, image, imageVersion);
    }

    @Command("mail:destroy <name>")
    @Description("Destroys a Mail service by name, with optional confirmation flags.")
    public async destroy(
        @Param("name")
        name: string,
        @Option("force", {
            type: "boolean",
            alias: "f",
            description: "Force destruction"
        })
        force?: boolean,
        @Option("yes", {
            type: "boolean",
            alias: "y",
            description: "Skip confirmation"
        })
        yes?: boolean
    ): Promise<void> {
        await this.mailService.destroy(name, force, yes);
    }

    @Command("mail:start [name]")
    @Description("Starts a Mail service by name, with an option to restart it if it's already running.")
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
    @Description("Stops a running Mail service by its name. If no name is provided, stops the default service.")
    public async stop(
        @Param("name")
        name?: string
    ): Promise<void> {
        await this.mailService.stop(name);
    }

    @Command("mail:use [name]")
    @Description("Sets a specified Mail service as the default or retrieves the current default service name if no service is specified.")
    public use(
        @Param("name")
        name?: string
    ): string|void {
        return this.mailService.use(name);
    }
}
