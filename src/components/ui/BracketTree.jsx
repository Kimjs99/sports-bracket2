import MatchCard from './MatchCard';

// Renders vertical connector between two match cards
function Connector({ isTop }) {
  return (
    <div
      style={{
        width: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 2,
          background: '#cbd5e1',
          flex: 1,
          marginLeft: 0,
          opacity: isTop ? 1 : 0,
        }}
      />
      <div style={{ width: 20, height: 2, background: '#cbd5e1' }} />
      <div
        style={{
          width: 2,
          background: '#cbd5e1',
          flex: 1,
          marginLeft: 0,
          opacity: isTop ? 0 : 1,
        }}
      />
    </div>
  );
}

function RoundColumn({ round, isLast }) {
  const matches = round.matches;

  // Group matches in pairs for connector rendering
  const pairs = [];
  for (let i = 0; i < matches.length; i += 2) {
    pairs.push([matches[i], matches[i + 1] ?? null]);
  }

  return (
    <div className="round-column" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="round-header">{round.name}</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-around',
          padding: '8px 0',
        }}
      >
        {matches.map((match, idx) => {
          const isEven = idx % 2 === 0;
          const hasPair = idx % 2 === 0 ? matches[idx + 1] !== undefined : matches[idx - 1] !== undefined;
          return (
            <div
              key={match.id}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                minHeight: 80,
              }}
            >
              <MatchCard match={match} />
              {!isLast && hasPair && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: 20,
                    alignSelf: 'stretch',
                    position: 'relative',
                  }}
                >
                  {/* Horizontal line from card */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      width: 10,
                      height: 2,
                      background: '#cbd5e1',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  {/* Vertical line: top half connects to pair bottom, bottom half connects to pair top */}
                  {isEven && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: 10,
                        width: 2,
                        height: '50%',
                        background: '#cbd5e1',
                      }}
                    />
                  )}
                  {!isEven && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '50%',
                        left: 10,
                        width: 2,
                        height: '50%',
                        background: '#cbd5e1',
                      }}
                    />
                  )}
                  {/* Horizontal line to next column, only for the "bottom of pair" */}
                  {!isEven && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: 10,
                        width: 10,
                        height: 2,
                        background: '#cbd5e1',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  )}
                </div>
              )}
              {!isLast && !hasPair && (
                <div style={{ width: 20 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BracketTree({ rounds }) {
  if (!rounds || rounds.length === 0) return null;

  return (
    <div className="bracket-scroll">
      <div className="bracket-container">
        {rounds.map((round, idx) => (
          <RoundColumn
            key={round.roundNum}
            round={round}
            isLast={idx === rounds.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
