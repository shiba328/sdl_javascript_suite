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

class ChoiceCell {
    /**
     * Creates a new instance of ChoiceCell
     * @class
     * @param {String} text - The primary text of the cell
     */
    constructor (text = null) {
        this._text = null;
        this._secondaryText = null;
        this._tertiaryText = null;
        this._uniqueText = null;
        this._voiceCommands = null;
        this._artwork = null;
        this._secondaryArtwork = null;
        this._choiceId = ChoiceCell.MAX_ID;

        if (text === null) {
            console.error('Attempted to create an invalid ChoiceCell: text does not exist');
            return;
        }

        this._text = text;
        this._uniqueText = text;
    }

    /**
     * Get the state text
     * @returns {String} - The primary text of the cell
     */
    getText () {
        return this._text;
    }

    /**
     * Set the state text
     * Maps to Choice.menuName. The primary text of the cell. Duplicates within an `ChoiceSet`
     * are not permitted and will result in the ChoiceSet failing to initialize.
     * @param {String} text - The primary text of the cell
     * @returns {ChoiceCell} - A reference to this instance to support method chaining
     */
    setText (text) {
        this._text = text;
        return this;
    }

    /**
     * Get the state secondaryText
     * @returns {String} - The secondary text of the cell
     */
    getSecondaryText () {
        return this._secondaryText;
    }

    /**
     * Set the state secondaryText
     * Maps to Choice.secondaryText. Optional secondary text of the cell, if available. Duplicates
     * within an `ChoiceSet` are permitted.
     * @param {String} secondaryText - The secondary text of the cell
     * @returns {ChoiceCell} - A reference to this instance to support method chaining
     */
    setSecondaryText (secondaryText) {
        this._secondaryText = secondaryText;
        return this;
    }

    /**
     * Get the state tertiaryText
     * @returns {String} - The tertiary text of the cell
     */
    getTertiaryText () {
        return this._tertiaryText;
    }

    /**
     * Set the state tertiaryText
     * Maps to Choice.tertiaryText. Optional tertiary text of the cell, if available. Duplicates within an `ChoiceSet` are permitted.
     * @param {String} tertiaryText - The tertiary text of the cell
     * @returns {ChoiceCell} - A reference to this instance to support method chaining
     */
    setTertiaryText (tertiaryText) {
        this._tertiaryText = tertiaryText;
        return this;
    }

    /**
     * Get the state unique text. USED INTERNALLY
     * @private
     * @returns {String} - The uniqueText to be used in place of primaryText when core does not support identical names for ChoiceSets
     */
    _getUniqueText () {
        return this._uniqueText;
    }

    /**
     * Set the unique state text. USED INTERNALLY
     * @private
     * @param {String} uniqueText - The uniqueText to be used in place of primaryText when core does not support identical names for ChoiceSets
     * @returns {ChoiceCell} - A reference to this instance to support method chaining
     */
    _setUniqueText (uniqueText) {
        this._uniqueText = uniqueText;
        return this;
    }

    /**
     * Get the state voiceCommands
     * @returns {String[]|null} - The list of voice command strings
     */
    getVoiceCommands () {
        return this._voiceCommands;
    }

    /**
     * Set the state voiceCommands
     * Maps to Choice.vrCommands. Optional voice commands the user can speak to activate the cell.
     * If not set and the head unit requires it, this will be set to the number in the list that this
     * item appears. However, this would be a very poor experience for a user if the choice set is
     * presented as a voice only interaction or both interaction mode. Therefore, consider not setting
     * this only when you know the choice set will be presented as a touch only interaction.
     * @param {String[]} voiceCommands - The list of voice command strings
     * @returns {ChoiceCell} - A reference to this instance to support method chaining
     */
    setVoiceCommands (voiceCommands) {
        this._voiceCommands = voiceCommands;
        return this;
    }

    /**
     * Get the state artwork
     * @returns {SdlArtwork} - The SdlArtwork
     */
    getArtwork () {
        return this._artwork;
    }

    /**
     * Set the state artwork
     * Maps to Choice.image. Optional image for the cell. This will be uploaded before the cell is
     * used when the cell is preloaded or presented for the first time.
     * @param {SdlArtwork} artwork - The SdlArtwork
     * @returns {ChoiceCell} - A reference to this instance to support method chaining
     */
    setArtwork (artwork) {
        this._artwork = artwork;
        return this;
    }

    /**
     * Get the state secondaryArtwork
     * @returns {SdlArtwork} - The SdlArtwork
     */
    getSecondaryArtwork () {
        return this._secondaryArtwork;
    }

    /**
     * Set the state secondaryArtwork
     * Maps to Choice.secondaryImage. Optional secondary image for the cell. This will be uploaded
     * before the cell is used when the cell is preloaded or presented for the first time.
     * @param {SdlArtwork} secondaryArtwork - The SdlArtwork
     * @returns {ChoiceCell} - A reference to this instance to support method chaining
     */
    setSecondaryArtwork (secondaryArtwork) {
        this._secondaryArtwork = secondaryArtwork;
        return this;
    }

    /**
     * Get the state choiceId
     * @private
     * @returns {Number} - The choice ID
     */
    _getChoiceId () {
        return this._choiceId;
    }

    /**
     * Set the state choiceId
     * @private
     * @param {Number} choiceId - The choice ID
     * @returns {ChoiceCell} - A reference to this instance to support method chaining
     */
    _setChoiceId (choiceId) {
        this._choiceId = choiceId;
        return this;
    }

    /**
     * Checks whether two ChoiceCells can be considered equivalent
     * @param {ChoiceCell} other - The object to compare
     * @returns {Boolean} - Whether the objects are the same or not
     */
    equals (other) {
        if (other === null || other === undefined) {
            return false;
        }
        if (this === other) {
            return true;
        }
        if (!(other instanceof ChoiceCell)) {
            return false;
        }
        // main comparison check
        if (this.getText() !== other.getText()) {
            return false;
        }
        if (this.getSecondaryText() !== other.getSecondaryText()) {
            return false;
        }
        if (this.getTertiaryText() !== other.getTertiaryText()) {
            return false;
        }
        if (this.getArtwork() === null && other.getArtwork() !== null) {
            return false;
        }
        if (this.getArtwork() !== null && !this.getArtwork().equals(other.getArtwork())) {
            return false;
        }
        if (this.getSecondaryArtwork() === null && other.getSecondaryArtwork() !== null) {
            return false;
        }
        if (this.getSecondaryArtwork() !== null &&  !this.getSecondaryArtwork().equals(other.getSecondaryArtwork())) {
            return false;
        }
        const voiceCommands = this.getVoiceCommands();
        const otherVoiceCommands = other.getVoiceCommands();

        if ((voiceCommands !== null && otherVoiceCommands === null) || (voiceCommands === null && otherVoiceCommands !== null)) {
            return false;
        }
        if ((voiceCommands !== null && otherVoiceCommands !== null)) {
            // extra voice command check as long as they're both not null
            if (voiceCommands.length !== otherVoiceCommands.length) {
                return false;
            }
            for (let index = 0; index < voiceCommands.length; index++) {
                if (voiceCommands[index] !== otherVoiceCommands[index]) {
                    return false;
                }
            }
        }
        return true;
    }
}

// MAX ID for cells - Reasoning is from Java library: cannot use Integer.MAX_INT as the value is too high.
ChoiceCell.MAX_ID = 2000000000;

export { ChoiceCell };
