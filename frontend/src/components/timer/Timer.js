import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./timer.css";

const Timer = () => {
  const [timeInSeconds, setTimeInSeconds] = useState(0); // Current countdown time in seconds
  const [isRunning, setIsRunning] = useState(false); // Timer running state
  const socket = useRef(null); // Ref to store the socket connection
  const intervalRef = useRef(null); // Ref to store the interval ID for clearing
  const logoRef = useRef(null); // Ref for the Scratch logo

  // Sync from the server every 500ms
  useEffect(() => {
    socket.current = io("http://localhost:3536", {
      transports: ["websocket", "polling"],
    });

    // On connection, get the initial timer state
    socket.current.on("sync", ({ endTime, isRunning, serverTime }) => {
      if (isRunning && endTime) {
        setIsRunning(true);
        const remainingTime = Math.max(0, Math.floor((endTime - serverTime) / 1000));
        setTimeInSeconds(remainingTime);
      } else {
        setIsRunning(false);
        setTimeInSeconds(0);
      }
    });

    return () => {
      socket.current.disconnect();
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Clean up the interval when component unmounts
      }
    };
  }, []);

  // Update the timer every second if running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeInSeconds((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            clearInterval(intervalRef.current);
            setIsRunning(false); // Stop the timer when it reaches 0
            return 0;
          }
          return newTime;
        });
      }, 1000); // Update every second

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current); // Clean up the interval on unmount or when stopped
        }
      };
    }
  }, [isRunning]); // Only run when the timer starts

  // Bouncing logo animation logic
  useEffect(() => {
    const logo = logoRef.current;
    const container = document.querySelector(".countdown-container");

    let x = 0, y = 0;
    let dx = 2, dy = 2; // Speed of the logo
    const moveLogo = () => {
      const containerRect = container.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();

      // Update position
      x += dx;
      y += dy;

      // Bounce off edges
      if (x + logoRect.width > containerRect.width || x < 0) dx = -dx;
      if (y + logoRect.height > containerRect.height || y < 0) dy = -dy;

      // Update logo position
      logo.style.transform = `translate(${x}px, ${y}px)`;

      requestAnimationFrame(moveLogo); // Keep the animation running
    };

    moveLogo(); // Start the animation
  }, []);

  // Function to format the time
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  };

  const { minutes, seconds } = formatTime(timeInSeconds);

  return (
    <div className="countdown-container">
      <img
        src="https://seeklogo.com/images/S/scratch-cat-logo-7F652C6253-seeklogo.com.png"
        alt="Scratch Logo"
        className="scratch-logo"
        ref={logoRef}
      />
      <h1>Timer</h1>
      <div className="countdown-box">
        <div className="countdown-item">
          <h1 className="countdown-value">{minutes}</h1>
          <span className="countdown-unit">Minutes</span>
        </div>
        <div className="countdown-item">
          <h1 className="countdown-value">{seconds}</h1>
          <span className="countdown-unit">Seconds</span>
        </div>
      </div>
    </div>
  );
};

export default Timer;
