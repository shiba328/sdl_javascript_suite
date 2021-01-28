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

import { _Task } from '../../_Task';
import { _ManagerUtility } from '../../_ManagerUtility';
import { ImageFieldName } from '../../../rpc/enums/ImageFieldName';
import { SpeechCapabilities } from '../../../rpc/enums/SpeechCapabilities';
import { Alert } from '../../../rpc/messages/Alert';
import { FunctionID } from '../../../rpc/enums/FunctionID';
import { CancelInteraction } from '../../../rpc/messages/CancelInteraction';
import { _DispatchGroup } from './_DispatchGroup';

class _PresentAlertOperation extends _Task {
    /**
     * Initializes an instance of _PresentAlertOperation.
     * @class
     * @param {_LifecycleManager} lifecycleManager - An instance of _LifecycleManager.
     * @param {AlertView} alertView - An instance of AlertView.
     * @param {WindowCapability} currentCapabilities - The capabilities of the default main window.
     * @param {SpeechCapabilities[]|null} speechCapabilities - An array of SpeechCapabilities enums or null.
     * @param {FileManager} fileManager - An instance of FileManager.
     * @param {Number} cancelId - The ID to be used during CancelInteraction.
     * @param {Function} listener - Callback function that is used when operation has finished.
     */
    constructor (lifecycleManager, alertView, currentCapabilities, speechCapabilities, fileManager = null, cancelId, listener) {
        super();
        this._lifecycleManager = lifecycleManager;
        this._alertView = alertView.clone();
        this._currentWindowCapability = currentCapabilities;
        this._speechCapabilities = speechCapabilities;
        this._fileManager = fileManager;
        this._cancelId = cancelId;
        this._listener = listener;

        this._alertView.canceledListener = function () {
            this.cancelAlert();
        };
    }

    /**
     * The method that causes the task to run.
     * @param {_Task} task - The task instance
     */
    onExecute (task) {
        this._start();
    }

    /**
     * If the task is not canceled, starts to assemble the alert
     * @private
     */
    async _start () {
        if (this.getState() === _Task.CANCELED) {
            this._finishOperation(false);
            return;
        }

        if (!this.isValidAlertViewData(this._alertView)) {
            if (this._alertView.getAudio() !== null && this._alertView.getAudio() !== undefined &&
                this._alertView.getAudio()._getAudioFiles() !== null && this._alertView.getAudio()._getAudioFiles() !== undefined &&
                this._alertView.getAudio()._getAudioFiles().size > 0) {
                console.log('The module does not support the use of only audio file data in an alert. ' +
                'The alert has no data and can not be sent to the module. ' +
                        'The use of audio file data in an alert is only supported on modules supporting RPC Spec v5.0 or newer');
            } else {
                console.log('The alert data is invalid.' +
                ' At least either text, secondaryText or audio needs to be provided. ' +
                        'Make sure to set at least the text, secondaryText or audio properties on the AlertView');
            }
            this._finishOperation(false, null);
            return;
        }
        const uploadFilesTask = new _DispatchGroup();

        uploadFilesTask.enter();
        uploadFilesTask.enter();

        uploadFilesTask.notify(async () => {
            await this.presentAlert();
        });

        await this.uploadImages();
        uploadFilesTask.leave();
        await this.uploadAudioFiles();
        uploadFilesTask.leave();
    }

    /**
     * Upload the _AlertView audio files to the module.
     * @returns {Boolean} - Whether the files where uploaded successfully.
     */
    async uploadAudioFiles () {
        if (this._alertView.getAudio() === null || this._alertView.getAudio() === undefined) {
            console.log('No audio sent for alert');
            return true;
        }
        if (!this.supportsAlertAudioFile()) {
            console.log('Module does not support audio files for alerts, skipping upload of audio files');
            return true;
        }
        if (this._alertView.getAudio()._getAudioFiles() === null || this._alertView.getAudio()._getAudioFiles() === undefined || this._alertView.getAudio()._getAudioFiles().size === 0) {
            console.log('No audio files to upload for alert');
            return true;
        }

        const filesToBeUploaded = [];
        for (const ttsChunk of this._alertView.getAudio().getAudioData()) {
            if (ttsChunk.getType() !== SpeechCapabilities.FILE) {
                continue;
            }
            const audioFile = this._alertView.getAudio()._getAudioFiles().get(ttsChunk.getText());
            if (this._fileManager === null || !this._fileManager.fileNeedsUpload(audioFile)) {
                continue;
            }
            filesToBeUploaded.push(audioFile);
        }

        if (filesToBeUploaded.length === 0) {
            console.log('No audio files need to be uploaded for alert');
            return true;
        }

        console.log('Uploading audio files for alert');

        if (this._fileManager !== null || this._fileManager !== undefined) {
            const successes = await this._fileManager.uploadFiles(filesToBeUploaded);

            if (this.getState() === _Task.CANCELED) {
                this._finishOperation(false, null);
                return false;
            }
            if (successes !== null && successes !== undefined && successes.includes(false)) {
                console.log('Error uploading alert audio files');
            } else {
                console.log('All alert audio files uploaded');
            }
            return true;
        }
    }

    /**
     * Checks whether the _AlertView has images that need to be uploaded, then uploads them.
     * @returns {Promise} - resoves to Boolean.
     */
    async uploadImages () {
        const artworksToBeUploaded = [];

        if (this.supportsAlertIcon() && this._fileManager !== null && this._fileManager.fileNeedsUpload(this._alertView.getIcon())) {
            artworksToBeUploaded.push(this._alertView.getIcon());
        }

        if (this._alertView.getSoftButtons() !== null && this._alertView.getSoftButtons() !== undefined) {
            for (const object of this._alertView.getSoftButtons()) {
                if (this.supportsSoftButtonImages() && object.getCurrentState() !== null && object.getCurrentState() !== undefined && this._fileManager !== null && this._fileManager.fileNeedsUpload(object.getCurrentState().getArtwork())) {
                    artworksToBeUploaded.push(object.getCurrentState().getArtwork());
                }
            }
        }

        return await this.sendImages(artworksToBeUploaded);
    }

    /**
     * Uploads an array of images to the module.
     * @param {SdlFile[]} images - An array of images to be uploaded.
     * @returns {Promise} - Whether the images were uploaded successfully.
     */
    async sendImages (images) {
        if (images.length === 0) {
            console.log('No Images to upload for alert');
            return true;
        }

        console.log('Uploading images for alert');

        if (this._fileManager !== null && this._fileManager !== undefined) {
            const successes = await this._fileManager.uploadArtworks(images);
            if (this.getState() === _Task.CANCELED) {
                console.log('Operation canceled');
                this._finishOperation(false, null);
                return false;
            }

            if (successes !== null && successes !== undefined && successes.includes(false)) {
                console.log('AlertManager artwork failed to upload with error');
                return false;
            } else {
                console.log('All alert images uploaded');
                return true;
            }
        }
    }

    /**
     * Presents the Alert in the window.
     */
    async presentAlert () {
        const alert = this.alertRpc();
        const response = await this._lifecycleManager.sendRpcResolve(alert);
        if (!response.getSuccess()) {
            console.log(`There was an error presenting the alert: ${response.getInfo()}`);
        } else {
            console.log('Alert finished presenting');
        }
        this._finishOperation(response.getSuccess(), response.getTryAgainTime());
    }

    /**
     * Sends a CancelInteraction to cancel the Alert.
     */
    async cancelAlert () {
        if (this.getState() === _Task.FINISHED) {
            console.logInfo('This operation has already finished so it can not be canceled');
            return;
        } else if (this.getState() === _Task.CANCELED) {
            console.log('This operation has already been canceled. It will be finished at some point during the operation.');
            return;
        } else if (this.getState() === _Task.IN_PROGRESS) {
            await this.cancelInteraction();
        } else {
            console.log('Cancelling an alert that has not yet been sent to Core');
            this.switchStates(_Task.CANCELED);
        }
    }

    /**
     * Sends a CancelInteraction to cancel the Alert.
     */
    async cancelInteraction () {
        if (this._lifecycleManager !== null && this._lifecycleManager !== undefined && this._lifecycleManager.getSdlMsgVersion() !== null && this._lifecycleManager.getSdlMsgVersion() !== undefined && this._lifecycleManager.getSdlMsgVersion().getMajorVersion() < 6) {
            console.log('Canceling an alert is not supported on this module');
        }
        console.log('Canceling the presented alert');

        const cancelInteraction = new CancelInteraction(FunctionID.Alert, this._cancelId);
        const response = await this._lifecycleManager.sendRpcResolve(cancelInteraction);
        if (!response.getSuccess()) {
            console.log(`Error canceling the presented alert: ${response.getInfo()}`);
            this.onFinished();
            return;
        }
        console.log('The presented alert was canceled successfully');
        this.onFinished();
    }

    /**
     * Creates an Alert from the _AlertView.
     * @returns {Alert} - The Alert created from the AlertView.
     */
    alertRpc () {
        let alert = new Alert();
        alert = this.assembleAlertText(alert);
        alert.setDuration(this._alertView.getTimeout() * 1000);
        if (this._alertView.getIcon() !== null && this._alertView.getIcon() !== undefined && this.supportsAlertIcon()) {
            alert.setAlertIcon(this._alertView.getIcon().getImageRPC());
        }
        alert.setProgressIndicator(this._alertView.isShowWaitIndicator());
        alert.setCancelID(this._cancelId);
        if (this._alertView.getSoftButtons() !== null) {
            const softButtons = [];
            for (const button of this._alertView.getSoftButtons()) {
                softButtons.push(button.getCurrentStateSoftButton());
            }
            alert.setSoftButtons(softButtons);
        }

        if (this._alertView.getAudio() !== null) {
            const alertAudioData = this._alertView.getAudio();
            alert.setPlayTone(alertAudioData.isPlayTone());

            if (alertAudioData.getAudioData().length > 0) {
                alert.setTtsChunks(this.getTTSChunksForAlert(alertAudioData));
            }
        }
        return alert;
    }

    /**
     * Pulls the TTSChunks from the AlertAudioData.
     * @param {AlertAudioData} alertAudioData - An AlertAudioData instance.
     * @returns {TTSChunk[]} - An array of TTSChunks.
     */
    getTTSChunksForAlert (alertAudioData) {
        const ttsChunks = alertAudioData.getAudioData();

        if (!this.supportsAlertAudioFile()) {
            for (const chunk of alertAudioData.getAudioData()) {
                if (chunk.getType() === SpeechCapabilities.FILE) {
                    ttsChunks.delete(chunk.getName());
                }
            }
        }

        return ttsChunks;
    }

    /**
     * Assembles the text for the Alert.
     * @param {Alert} alert - An instance of Alert.
     * @returns {Alert} - An instance of Alert.
     */
    assembleAlertText (alert) {
        const nonNullFields = this.findNonNullTextFields();
        if (nonNullFields.length === 0) {
            return alert;
        }
        const numberOfLines = _ManagerUtility.getMaxNumberOfAlertFieldLines(this._currentWindowCapability);
        switch (numberOfLines) {
            case 1:
                alert = this.assembleOneLineAlertText(alert, nonNullFields);
                break;
            case 2:
                alert = this.assembleTwoLineAlertText(alert);
                break;
            case 3:
                alert = this.assembleThreeLineAlertText(alert);
                break;
        }
        return alert;
    }

    /**
     * Pulls all non-empty text fields from the _AlertView.
     * @returns {String[]} - An array of non-empty text fields.
     */
    findNonNullTextFields () {
        const array = [];

        if (this._alertView.getText() !== null && this._alertView.getText() !== undefined && this._alertView.getText().length > 0) {
            array.push(this._alertView.getText());
        }

        if (this._alertView.getSecondaryText() !== null && this._alertView.getSecondaryText() !== undefined && this._alertView.getSecondaryText().length > 0) {
            array.push(this._alertView.getSecondaryText());
        }

        if (this._alertView.getTertiaryText() !== null && this._alertView.getTertiaryText() !== undefined && this._alertView.getTertiaryText().length > 0) {
            array.push(this._alertView.getTertiaryText());
        }

        return array;
    }

    /**
     * Sets the Alert's text information.
     * @param {Alert} alert - An Alert RPC.
     * @param {String[]} alertFields - The Alert text fields.
     * @returns {Alert} - The modified Alert.
     */
    assembleOneLineAlertText (alert, alertFields) {
        let alertString1 = '';
        for (let index = 0; index < alertFields.length; index++) {
            if (index > 0) {
                alertString1 += ` - ${alertFields[index]}`;
            } else {
                alertString1 += `${alertFields[index]}`;
            }
        }
        alert.setAlertText1(alertString1.toString());
        return alert;
    }

    /**
     * Sets the Alert's text information.
     * @param {Alert} alert - An Alert RPC.
     * @returns {Alert} - The modified Alert.
     */
    assembleTwoLineAlertText (alert) {
        if (this._alertView.getText() !== null && this._alertView.getText() !== undefined && this._alertView.getText().length > 0) {
            alert.setAlertText1(this._alertView.getText());
        }
        if (this._alertView.getSecondaryText() !== null && this._alertView.getSecondaryText() !== undefined && this._alertView.getSecondaryText().length > 0) {
            if ((this._alertView.getTertiaryText() === null || !(this._alertView.getTertiaryText().length > 0))) {
                // TertiaryText does not exist
                alert.setAlertText2(this._alertView.getSecondaryText());
            } else {
                // Text 3 exists, put secondaryText and TertiaryText in AlertText2
                alert.setAlertText2(`${this._alertView.getSecondaryText()} - ${this._alertView.getTertiaryText()}`);
            }
        }
        return alert;
    }

    /**
     * Sets the Alert's text information.
     * @param {Alert} alert - An Alert RPC.
     * @returns {Alert} - The modified Alert.
     */
    assembleThreeLineAlertText (alert) {
        if (this._alertView.getText() !== null && this._alertView.getText !== undefined && this._alertView.getText().length > 0) {
            alert.setAlertText1(this._alertView.getText());
        }

        if (this._alertView.getSecondaryText() !== null && this._alertView.getSecondaryText() !== undefined && this._alertView.getSecondaryText().length > 0) {
            alert.setAlertText2(this._alertView.getSecondaryText());
        }

        if (this._alertView.getTertiaryText() !== null && this._alertView.getTertiaryText() !== undefined && this._alertView.getTertiaryText().length > 0) {
            alert.setAlertText3(this._alertView.getTertiaryText());
        }

        return alert;
    }

    /**
     * Check to see if template supports soft button images.
     * @returns {Boolean} - True if soft button images are supported, false if not.
     */
    supportsSoftButtonImages () {
        const softButtonCapabilities = this._currentWindowCapability.getSoftButtonCapabilities()[0];
        return softButtonCapabilities.getImageSupported();
    }

    /**
     * Check to see if template supports Alert audio files.
     * @returns {Boolean} - True if Alert audio files are supported, false if not.
     */
    supportsAlertAudioFile () {
        return (this._lifecycleManager !== null && this._lifecycleManager !== undefined
             && this._lifecycleManager.getSdlMsgVersion() !== null && this._lifecycleManager.getSdlMsgVersion() !== undefined
             && this._lifecycleManager.getSdlMsgVersion().getMajorVersion() >= 5
             && this._speechCapabilities !== null && this._speechCapabilities.includes(SpeechCapabilities.FILE));
    }

    /**
     * Check to see if template supports Alert icons.
     * @returns {Boolean} - True if Alert icons are supported, false if not.
     */
    supportsAlertIcon () {
        return _ManagerUtility.hasImageFieldOfName(this._currentWindowCapability, ImageFieldName.alertIcon);
    }

    /**
     * Check to see if template supports the soft button images.
     * @param {AlertView} alertView - An AlertView instance.
     * @returns {Boolean} - True if soft button images are supported, false if not.
     */
    isValidAlertViewData (alertView) {
        if (alertView.getText() !== null && alertView.getText() !== undefined && alertView.getText().length > 0) {
            return true;
        }
        if (alertView.getSecondaryText() !== null && alertView.getSecondaryText() !== undefined && alertView.getSecondaryText().length > 0) {
            return true;
        }
        if (alertView.getAudio() !== null && alertView.getAudio() !== undefined && alertView.getAudio().getAudioData().size() > 0) {
            return true;
        }
        return false;
    }

    /**
     * Method to be called once the task has completed.
     * @private
     * @param {Boolean} success - Whether the task was successful.
     * @param {Number} tryAgainTime - Try again time.
     */
    _finishOperation (success, tryAgainTime) {
        console.log('Finishing present alert operation');
        if (this._listener !== null && this._listener !== undefined) {
            this._listener.onComplete(success, tryAgainTime);
        }
        this.onFinished();
    }

    /**
     * Updates WindowCapability if the operation is pending the in the Alert Manager.
     * @param {WindowCapability} defaultMainWindowCapability - The capabilities of the default main window.
     */
    setWindowCapability (defaultMainWindowCapability) {
        this._currentWindowCapability = defaultMainWindowCapability;
    }
}

export { _PresentAlertOperation };