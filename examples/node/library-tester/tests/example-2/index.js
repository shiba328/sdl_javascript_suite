/*
* Copyright (c) 2019, Livio, Inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
* Redistributions of source code must retain the above copyright notice, this
* list of conditions and the following disclaimer.
*
* Redistributions in binary form must reproduce the above copyright notice,
* this list of conditions and the following
* disclaimer in the documentation and/or other materials provided with the
* distribution.
*
* Neither the name of the Livio Inc. nor the names of its contributors
* may be used to endorse or promote products derived from this software
* without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
* ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
* LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
* CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
* SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
* INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
* CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
* ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
* POSSIBILITY OF SUCH DAMAGE.
*/

const SDL = require('../../SDL.min.js');
const AppHelper = require('../../AppHelper.js');

module.exports = async function (catalogRpc) {
    const appId = 'example-app-2';

    const fileName = `${appId}_icon.gif`;
    const file = new SDL.manager.file.filetypes.SdlFile()
        .setName(fileName)
        .setFilePath('./tests/example-2/test_icon_1.png')
        .setType(SDL.rpc.enums.FileType.GRAPHIC_PNG)
        .setPersistent(true);

    const appConfig = new SDL.manager.AppConfig()
        .setAppId(appId)
        .setAppName(appId)
        .setIsMediaApp(false)
        .setLanguageDesired(SDL.rpc.enums.Language.EN_US)
        .setHmiDisplayLanguageDesired(SDL.rpc.enums.Language.EN_US)
        .setAppTypes([
            SDL.rpc.enums.AppHMIType.MEDIA,
            SDL.rpc.enums.AppHMIType.REMOTE_CONTROL,
        ])
        .setTransportConfig(new SDL.transport.TcpClientConfig(process.env.HOST, process.env.PORT))
        .setAppIcon(file);

    const app = new AppHelper(catalogRpc)
        .setAppConfig(appConfig);

    await app.start(); // after this point, we are in HMI FULL and managers are ready
    const sdlManager = app.getManager();
    
    // app logic start
    // add voice commands
    const screenManager = sdlManager.getScreenManager();
    screenManager.setVoiceCommands([
        new SDL.manager.screen.utils.VoiceCommand(['Option 1'], () => {
            console.log('Option one selected!');
        }),
        new SDL.manager.screen.utils.VoiceCommand(['Option 2'], () => {
            console.log('Option two selected!');
        }),
        new SDL.manager.screen.utils.VoiceCommand(['Option 3'], () => {
            console.log('Option three selected!');
        }),
    ]);

    // set up the presentation for the manager
    screenManager.setTextField1('Hello SDL!');
    screenManager.setTextField2('こんにちは');
    screenManager.setTextField3('你好');
    screenManager.setTitle('JavaScript Library');
    screenManager.setTextAlignment(SDL.rpc.enums.TextAlignment.RIGHT_ALIGNED);
    screenManager.setPrimaryGraphic(new SDL.manager.file.filetypes.SdlArtwork('sdl-logo', SDL.rpc.enums.FileType.GRAPHIC_PNG)
        .setFilePath('./tests/example-2/test_icon_1.png'));

    await sleep(3000);

    const count = 3;
    for (let i = 0; i < count; i++) {
        const showCountdown = new SDL.rpc.messages.Show();
        showCountdown.setMainField1(`Exiting in ${(count - i).toString()}`)
            .setMainField2('')
            .setMainField3('');

        sdlManager.sendRpc(showCountdown); // don't wait for a response

        await sleep();
    }

    // tear down the app
    await sdlManager.sendRpc(new SDL.rpc.messages.UnregisterAppInterface());
    sdlManager.dispose();
};

function sleep (timeout = 1000) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}