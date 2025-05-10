import React, { useState, useEffect } from 'react';

const SpeechToText = ({ listening, onSpeechResult }) => {

  const [text, setText] = useState('');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  

  recognition.continuous = true;
  recognition.interimResults = true;

  const startListening = () => {
    recognition.start();
    recognition.onresult = (event) => {
      const currentTranscript = event.results[event.resultIndex][0].transcript;
      setText(currentTranscript); // Update local state with the transcribed text
      onSpeechResult(currentTranscript); // Pass the transcribed text to the parent component
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
  };

  const stopListening = () => {
    recognition.stop();
  };

  useEffect(() => {
    if (listening) {
      startListening(); // Start listening when 'listening' is true
    } else {
      stopListening(); // Stop listening when 'listening' is false
    }

    return () => {
      stopListening(); // Clean up when the component is unmounted or the listening state changes
    };
  }, [listening]);

  return null;
};

export default SpeechToText;
