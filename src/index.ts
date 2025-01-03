import {
    Plugin,
    PluginConfigService
} from "@wocker/core";

import {MailController} from "./controllers/MailController";
import {MailService} from "./services/MailService";


@Plugin({
    name: "mail",
    controllers: [
        MailController
    ],
    providers: [
        PluginConfigService,
        MailService
    ]
})
export default class MailPlugin {}
