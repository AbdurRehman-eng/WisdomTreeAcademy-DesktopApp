import React, { useState } from 'react';
import './AssessmentRunner.css';
import { useApp } from '../context/AppContext';
import AudioControl from '../components/common/AudioControl';
import { X, Star, ArrowRight, Award, RotateCcw } from 'lucide-react';

export const AssessmentRunner = () => {
  const { setScreen, showToast } = useApp();

  // Child-focused mock questions
  const childQuestions = [
    {
      id: 'CQ1',
      text: 'Which animal makes the "meow" sound?',
      options: ['Dog', 'Cat', 'Lion', 'Cow'],
      correct: 'Cat',
      audioText: 'Let’s look at the animals. Which animal makes the meow sound? Is it the Dog, the Cat, the Lion, or the Cow? Tap the right one!'
    },
    {
      id: 'CQ2',
      text: 'What is the color of the sun?',
      options: ['Blue', 'Green', 'Yellow', 'Purple'],
      correct: 'Yellow',
      audioText: 'Look up in the sky! What is the color of the sun? Is it Blue, Green, Yellow, or Purple? Choose the color of the sun.'
    },
    {
      id: 'CQ3',
      text: 'How many fingers do you have on one hand?',
      options: ['Three', 'Four', 'Five', 'Ten'],
      correct: 'Five',
      audioText: 'Let’s count our fingers! How many fingers do you have on one hand? Three, Four, Five, or Ten? Show me on your hand!'
    }
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [bounceOption, setBounceOption] = useState(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const activeQuestion = childQuestions[currentIdx];

  const handleAnswerSelect = (option, idx) => {
    setSelectedAnswer(option);
    setBounceOption(idx);
    
    // Clear bounce after animation completes
    setTimeout(() => {
      setBounceOption(null);
    }, 450);
  };

  const handleNext = () => {
    // Audit correct scores
    if (selectedAnswer === activeQuestion.correct) {
      setCorrectAnswersCount(prev => prev + 1);
    }

    if (currentIdx < childQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAnswer(null);
    } else {
      setIsCompleted(true);
      showToast('Assessment finished! Preparing scorecard.', 'success');
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setCorrectAnswersCount(0);
    setIsCompleted(false);
  };

  // Calculate progress percentage
  const progressPercent = ((currentIdx) / childQuestions.length) * 100;
  const activeProgressPercent = ((currentIdx + (selectedAnswer ? 1 : 0)) / childQuestions.length) * 100;

  return (
    <div className="child-assessment-viewport font-poppins">
      {/* Top Banner Row */}
      <div className="child-top-banner">
        <div className="child-banner-left">
          <span className="child-brand-emoji">🌳</span>
          <span className="child-brand-title">Wisdom Tree Academy</span>
        </div>
        
        {/* Child-friendly Star Progress bar */}
        <div className="child-progress-container">
          <div className="child-progress-bar-bg">
            <div className="child-progress-bar-fill" style={{ width: `${activeProgressPercent}%` }}></div>
          </div>
          <div className="child-progress-stars">
            {childQuestions.map((_, index) => {
              const isFilled = index < currentIdx || (index === currentIdx && selectedAnswer);
              return (
                <Star
                  key={index}
                  size={20}
                  className={`progress-star-icon ${isFilled ? 'filled' : ''}`}
                  fill={isFilled ? '#F5A623' : 'transparent'}
                />
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setScreen('dashboard')}
          className="child-exit-btn"
          title="Exit assessment and return to portal"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="child-main-content">
        {!isCompleted ? (
          <div className="child-question-workspace fade-in">
            {/* Friendly Audio Read Aloud */}
            <div className="child-audio-section">
              <AudioControl theme="child" audioText={activeQuestion.audioText} />
            </div>

            {/* Question Text */}
            <div className="child-question-card">
              <h2 className="child-question-prompt">{activeQuestion.text}</h2>
            </div>

            {/* MCQ Option Buttons */}
            <div className="child-answers-grid">
              {activeQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const letter = String.fromCharCode(65 + idx);
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option, idx)}
                    className={`child-answer-tile option-${idx} ${isSelected ? 'selected' : ''} ${bounceOption === idx ? 'bounce-active' : ''}`}
                  >
                    <div className="child-tile-letter">{letter}</div>
                    <span className="child-tile-text">{option}</span>
                    {isSelected && (
                      <span className="child-selected-checkmark">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Navigation (Next button appears only after selection) */}
            <div className="child-nav-footer">
              {selectedAnswer && (
                <button
                  onClick={handleNext}
                  className="child-next-button fade-in"
                >
                  <span>{currentIdx === childQuestions.length - 1 ? 'Finish Assessment' : 'Next Question'}</span>
                  <ArrowRight size={22} style={{ marginLeft: '10px' }} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ================= Assessment Completed Celebration Screen ================= */
          <div className="child-celebration-card card fade-in">
            <div className="celebration-trophy-wrapper">
              <Award size={80} className="trophy-icon" />
            </div>
            <h1 className="celebration-title">Super Job!</h1>
            <p className="celebration-subtext">You have completed all your questions today. Your teacher is very proud of you!</p>

            <div className="celebration-score-plate">
              <span className="score-plate-label">Your Stars Collected</span>
              <div className="score-plate-stars">
                {childQuestions.map((_, index) => {
                  const isGold = index < correctAnswersCount;
                  return (
                    <Star
                      key={index}
                      size={32}
                      className={`score-star ${isGold ? 'gold' : 'muted'}`}
                      fill={isGold ? '#F5A623' : 'transparent'}
                    />
                  );
                })}
              </div>
              <span className="score-plate-desc">{correctAnswersCount} out of {childQuestions.length} answered correctly!</span>
            </div>

            <div className="celebration-actions">
              <button onClick={handleReset} className="child-celebration-btn secondary">
                <RotateCcw size={18} style={{ marginRight: '8px' }} />
                Try Again
              </button>
              <button onClick={() => setScreen('dashboard')} className="child-celebration-btn primary">
                Go Back to Classroom
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentRunner;
