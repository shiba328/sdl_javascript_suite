/*
* Copyright (c) 2020, Livio, Inc.
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

import { SpeechCapabilities } from '../../rpc/enums/SpeechCapabilities';
import { TTSChunk } from '../../rpc/structs/TTSChunk';

class AudioData {
    constructor (phoneticString = null, phoneticType = null, audioFile = null) {
        if (phoneticType !== null && phoneticType !== undefined && !this.isValidPhoneticType(phoneticType)) {
            return;
        }
        if (audioFile !== null && audioFile !== undefined) {
            this._audioFiles = [];
            this._audioFiles.push(audioFile);
        }
        if (phoneticString !== null && phoneticString !== undefined) {
            if (phoneticType === null || phoneticType === undefined) {
                phoneticType = SpeechCapabilities.SC_TEXT;
            }
            this._prompts = [];
            this._prompts.push(new TTSChunk().setText(phoneticString).setType(phoneticType));
        }
    }

    isValidPhoneticType (phoneticType) {
        if (!(phoneticType === SpeechCapabilities.SAPI_PHONEMES || phoneticType === SpeechCapabilities.LHPLUS_PHONEMES
                || phoneticType === SpeechCapabilities.SC_TEXT || phoneticType === SpeechCapabilities.PRE_RECORDED)) {
            return false;
        }
        return true;
    }

    addAudioFiles (audioFiles) {
        if (this._audioFiles === null || this._audioFiles === undefined) {
            this._audioFiles = [];
        }
        this._audioFiles.push.apply(this._audioFiles, audioFiles);
    }

    addSpeechSynthesizerStrings (spokenString) {
        if (spokenString.length === 0) {
            return;
        }
        const newPrompts = [];
        for (const spoken of spokenString) {
            if (spoken.length === 0) {
                break;
            }
            newPrompts.push(new TTSChunk().setText(spoken));
        }
        if (newPrompts.length === 0) {
            return;
        }
        if (this._prompts === null || this._prompts === undefined) {
            this._prompts = newPrompts;
            return;
        }
        this._prompts.push.apply(this._prompts, newPrompts);
    }

    addPhoneticSpeechSynthesizerStrings (phoneticString, phoneticType) {
        if (!this.isValidPhoneticType(phoneticType) || phoneticString.length === 0) {
            return;
        }
        const newPrompts = [];
        for (const phonetic of phoneticString) {
            if (phonetic.length === 0) {
                break;
            }
            newPrompts.push(new TTSChunk().setText(phonetic).setType(phoneticType));
        }
        if (newPrompts.length === 0) {
            return;
        }
        this._prompts.push.apply(this._prompts, newPrompts);
    }

    getAudioFiles () {
        return this._audioFiles;
    }

    getPrompts () {
        return this._prompts;
    }
}

export { AudioData };